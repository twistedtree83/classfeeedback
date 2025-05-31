import { supabase } from './supabaseClient';

const SYSTEM_PROMPT = `You are an expert at analyzing lesson plans and structuring them into clear, organized formats. When given lesson content, break it down into:

1. Title: Keep the provided title
2. Summary: A brief 2-3 sentence overview of what students will learn
3. Duration: Total lesson time (e.g. "45 minutes", "1 hour")
4. Learning Objectives: 3-5 specific, measurable objectives starting with action verbs
5. Required Materials: All physical and digital resources needed
6. Lesson Sections: Organized teaching segments, each with:
   - Title: Clear section heading
   - Duration: Time allocation
   - Content: Main teaching points and explanations
   - Activities: Specific exercises or tasks
   - Assessment: How to check understanding

Format your response as a JSON object with these exact fields: title, summary, duration, objectives (array), materials (array), and sections (array of objects with id, title, duration, content, activities array, and assessment).`;

interface AIResponse {
  title: string;
  summary: string;
  duration: string;
  objectives: string[];
  materials: string[];
  sections: {
    id: string;
    title: string;
    duration: string;
    content: string;
    activities: string[];
    assessment: string;
  }[];
}

export async function aiAnalyzeLesson(content: string): Promise<AIResponse> {
  try {
    // Get API key from Supabase with better error handling
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'OPENAI_API_KEY')
      .single();

    if (secretError) {
      if (secretError.message.includes('no rows')) {
        throw new Error('OpenAI API key not found in database. Please contact your administrator.');
      }
      throw new Error(`Failed to retrieve API key: ${secretError.message}`);
    }

    if (!secretData?.value) {
      throw new Error('API key is missing or invalid. Please contact your administrator.');
    }
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretData.value}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this lesson plan content: ${content}` }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    
    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.error('AI analysis failed:', data);
      return fallbackAnalysis(content);
    }

    try {
      const result = JSON.parse(data.choices[0].message.content);
      return validateAndCleanResponse(result);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return fallbackAnalysis(content);
    }
  } catch (error) {
    console.error('Error analyzing lesson:', error);
    throw error; // Propagate the error to show the user
  }
}

function validateAndCleanResponse(response: any): AIResponse {
  // Ensure all required fields exist
  const cleaned: AIResponse = {
    title: response.title || 'Untitled Lesson',
    summary: response.summary || 'No summary provided',
    duration: response.duration || '60 minutes',
    objectives: Array.isArray(response.objectives) ? response.objectives : [],
    materials: Array.isArray(response.materials) ? response.materials : [],
    sections: Array.isArray(response.sections) ? response.sections.map((section: any, index: number) => ({
      id: section.id || String(index + 1),
      title: section.title || `Section ${index + 1}`,
      duration: section.duration || '15 minutes',
      content: section.content || 'No content provided',
      activities: Array.isArray(section.activities) ? section.activities : [],
      assessment: section.assessment || 'Monitor student progress and understanding'
    })) : []
  };

  // Ensure at least one section exists
  if (cleaned.sections.length === 0) {
    cleaned.sections = [
      {
        id: '1',
        title: 'Main Section',
        duration: cleaned.duration,
        content: 'Content to be covered in this lesson',
        activities: ['Class discussion'],
        assessment: 'Monitor student progress and understanding'
      }
    ];
  }

  return cleaned;
}

function fallbackAnalysis(content: string): AIResponse {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return {
    title: 'Untitled Lesson',
    summary: `This lesson covers ${content.slice(0, 100)}...`,
    duration: '60 minutes',
    objectives: [
      'Understand key concepts from the material',
      'Apply learning to practical examples',
      'Demonstrate comprehension through exercises'
    ],
    materials: ['Lesson handouts', 'Writing materials'],
    sections: [
      {
        id: '1',
        title: 'Introduction',
        duration: '10 minutes',
        content: paragraphs.slice(0, Math.max(1, Math.floor(paragraphs.length * 0.2))).join('\n\n'),
        activities: ['Class discussion'],
        assessment: 'Monitor student participation and initial understanding'
      },
      {
        id: '2',
        title: 'Main Content',
        duration: '40 minutes',
        content: paragraphs.slice(Math.floor(paragraphs.length * 0.2), Math.floor(paragraphs.length * 0.8)).join('\n\n'),
        activities: ['Group work', 'Individual practice'],
        assessment: 'Check work completion and accuracy'
      },
      {
        id: '3',
        title: 'Conclusion',
        duration: '10 minutes',
        content: paragraphs.slice(Math.floor(paragraphs.length * 0.8)).join('\n\n'),
        activities: ['Review', 'Exit ticket'],
        assessment: 'Collect and review exit tickets'
      }
    ]
  };
}