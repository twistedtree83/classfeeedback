import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LLMWhisperer API configuration
const LLMWHISPERER_API_URL = 'https://llmwhisperer.unstract.com/api/v1/whisper';
const LLMWHISPERER_STATUS_URL = 'https://llmwhisperer.unstract.com/api/v1/whisper-status';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const llmWhispererKey = Deno.env.get('LLMWHISPERER_API_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey || !llmWhispererKey) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { lessonPlanId } = await req.json();
    
    if (!lessonPlanId) {
      throw new Error('lessonPlanId is required');
    }

    console.log('Processing lesson plan:', lessonPlanId);

    // Fetch lesson plan from database
    const { data: lessonPlan, error: fetchError } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', lessonPlanId)
      .single();

    if (fetchError || !lessonPlan) {
      throw new Error(`Failed to fetch lesson plan: ${fetchError?.message || 'Not found'}`);
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('lesson_plans')
      .download(lessonPlan.pdf_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message || 'File not found'}`);
    }

    console.log('Downloaded PDF, sending to LLMWhisperer...');

    // Step 1: Send PDF to LLMWhisperer
    const formData = new FormData();
    formData.append('file', fileData, lessonPlan.pdf_path);
    
    const whisperResponse = await fetch(LLMWHISPERER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${llmWhispererKey}`,
      },
      body: formData
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      throw new Error(`LLMWhisperer API error: ${error}`);
    }

    const whisperResult = await whisperResponse.json();
    const whisperHash = whisperResult.whisper_hash;

    console.log('LLMWhisperer processing started, hash:', whisperHash);

    // Step 2: Poll for completion
    let extractedText = '';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`${LLMWHISPERER_STATUS_URL}?whisper_hash=${whisperHash}`, {
        headers: {
          'Authorization': `Bearer ${llmWhispererKey}`,
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check LLMWhisperer status');
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'processed') {
        extractedText = statusData.extracted_text;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error('LLMWhisperer processing failed');
      }
      
      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!extractedText) {
      throw new Error('LLMWhisperer processing timeout');
    }

    console.log('Successfully extracted text from PDF');

    // Step 3: Process the extracted text into lesson plan structure
    const processedContent = await processExtractedText(extractedText, lessonPlan.title);

    // Step 4: Update the lesson plan with processed content
    const { error: updateError } = await supabase
      .from('lesson_plans')
      .update({ processed_content: processedContent })
      .eq('id', lessonPlanId);

    if (updateError) {
      throw new Error(`Failed to update lesson plan: ${updateError.message}`);
    }

    console.log('Successfully processed lesson plan');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: processedContent 
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing lesson plan:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

// Process extracted text into structured lesson plan
async function processExtractedText(text: string, title: string): Promise<any> {
  // Split text into lines for analysis
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract different sections
  const objectives = extractObjectives(lines);
  const topics = extractTopics(lines);
  const assessmentPoints = extractAssessmentPoints(lines);
  const resources = extractResources(lines);
  
  return {
    title: title,
    objectives: objectives.length > 0 ? objectives : getDefaultObjectives(),
    topics: topics.length > 0 ? topics : getDefaultTopics(),
    assessmentPoints: assessmentPoints.length > 0 ? assessmentPoints : getDefaultAssessmentPoints(),
    resources: resources.length > 0 ? resources : getDefaultResources(),
    metadata: {
      processedAt: new Date().toISOString(),
      textLength: text.length,
      extractionMethod: 'llmwhisperer'
    }
  };
}

function extractObjectives(lines: string[]): string[] {
  const objectives: string[] = [];
  const keywords = ['objective', 'goal', 'learning outcome', 'students will', 'learners will'];
  
  let inObjectivesSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inObjectivesSection = true;
      continue;
    }
    
    if (inObjectivesSection) {
      if (/^[\d•\-*]+[\.\)]\s/.test(line.trim())) {
        objectives.push(line.replace(/^[\d•\-*]+[\.\)]\s/, '').trim());
      } else if (line.trim() === '' || /^[A-Z][^.]*:/.test(line)) {
        inObjectivesSection = false;
      }
    }
    
    if (objectives.length >= 5) break;
  }
  
  return objectives;
}

function extractTopics(lines: string[]): Array<{title: string, content: string, duration: string}> {
  const topics: Array<{title: string, content: string, duration: string}> = [];
  const sectionKeywords = ['topic', 'section', 'module', 'chapter', 'part', 'lesson'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (/^\d+[\.\)]\s/.test(line) || 
        sectionKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
      
      const title = line.replace(/^\d+[\.\)]\s/, '').replace(/^(Topic|Section|Module|Chapter|Part|Lesson)\s*\d*:?\s*/i, '').trim();
      
      let content = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (!/^\d+[\.\)]/.test(lines[j]) && !sectionKeywords.some(kw => lines[j].toLowerCase().includes(kw))) {
          content += lines[j] + ' ';
        } else {
          break;
        }
      }
      
      topics.push({
        title: title || `Topic ${topics.length + 1}`,
        content: content.trim() || 'Details for this section',
        duration: estimateDuration(content)
      });
    }
    
    if (topics.length >= 8) break;
  }
  
  return topics;
}

function extractAssessmentPoints(lines: string[]): string[] {
  const assessments: string[] = [];
  const keywords = ['assessment', 'evaluate', 'quiz', 'test', 'check understanding', 'review question'];
  
  let inAssessmentSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inAssessmentSection = true;
      continue;
    }
    
    if (inAssessmentSection && /^[\d•\-*]+[\.\)]/.test(line.trim())) {
      assessments.push(line.replace(/^[\d•\-*]+[\.\)]\s/, '').trim());
    } else if (inAssessmentSection && line.trim() === '') {
      inAssessmentSection = false;
    }
    
    if (assessments.length >= 5) break;
  }
  
  return assessments;
}

function extractResources(lines: string[]): string[] {
  const resources: string[] = [];
  const keywords = ['resource', 'material', 'reference', 'reading', 'bibliography', 'source'];
  
  let inResourceSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inResourceSection = true;
      continue;
    }
    
    if (inResourceSection) {
      if (/^[\d•\-*]+[\.\)]/.test(line.trim()) || /^[A-Za-z]/.test(line.trim())) {
        const resource = line.replace(/^[\d•\-*]+[\.\)]\s/, '').trim();
        if (resource.length > 5) {
          resources.push(resource);
        }
      } else if (line.trim() === '') {
        inResourceSection = false;
      }
    }
    
    if (resources.length >= 5) break;
  }
  
  return resources;
}

function estimateDuration(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(5, Math.ceil(words / 150) * 5);
  return `${minutes} minutes`;
}

function getDefaultObjectives(): string[] {
  return [
    "Understand the key concepts presented in this lesson",
    "Apply learned principles to practical examples",
    "Develop critical thinking and problem-solving skills",
    "Collaborate effectively with peers during activities"
  ];
}

function getDefaultTopics(): Array<{title: string, content: string, duration: string}> {
  return [
    {
      title: "Introduction & Warm-up",
      content: "Review previous concepts and introduce new material",
      duration: "10 minutes"
    },
    {
      title: "Main Concept Presentation",
      content: "Core lesson content with explanations and examples",
      duration: "20 minutes"
    },
    {
      title: "Guided Practice",
      content: "Teacher-led exercises to reinforce understanding",
      duration: "15 minutes"
    },
    {
      title: "Independent/Group Work",
      content: "Students apply concepts through activities",
      duration: "15 minutes"
    },
    {
      title: "Review & Assessment",
      content: "Summarize key points and check for understanding",
      duration: "10 minutes"
    }
  ];
}

function getDefaultAssessmentPoints(): string[] {
  return [
    "Can students explain the main concepts in their own words?",
    "Are students able to apply the concepts to new situations?",
    "Do students demonstrate understanding through their work?",
    "Can students identify connections to previous lessons?"
  ];
}

function getDefaultResources(): string[] {
  return [
    "Lesson plan PDF document",
    "Whiteboard or digital presentation tools",
    "Student handouts or worksheets",
    "Additional reference materials as needed"
  ];
}