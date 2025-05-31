import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { OpenAI } from 'npm:openai@4.20.1';
import { PDFLoader } from 'npm:langchain/document_loaders/fs/pdf';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB limit

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processing lesson plan request');
    const { lessonPlanId, filePath } = await req.json();
    console.log('Lesson plan ID:', lessonPlanId);
    console.log('File path:', filePath);

    if (!lessonPlanId || !filePath) {
      throw new Error('Lesson plan ID and file path are required');
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');

    const openai = new OpenAI({
      apiKey: openaiKey
    });
    console.log('OpenAI client initialized');

    // Get lesson plan details
    console.log('Fetching lesson plan details');
    const { data: lessonPlan, error: fetchError } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', lessonPlanId)
      .single();

    if (fetchError || !lessonPlan) {
      console.error('Error fetching lesson plan:', fetchError);
      throw new Error('Lesson plan not found');
    }
    console.log('Lesson plan found:', { id: lessonPlan.id, title: lessonPlan.title });

    // Download PDF from storage
    console.log('Downloading PDF from storage:', { path: filePath });
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('lesson_plans')
      .download(filePath);

    if (downloadError || !pdfData) {
      console.error('Error downloading PDF:', downloadError);
      throw new Error('Failed to download PDF');
    }
    console.log('PDF downloaded successfully');

    // Check PDF size
    const pdfSize = pdfData.size;
    if (pdfSize > MAX_PDF_SIZE) {
      throw new Error('PDF file is too large. Please upload a file smaller than 10MB.');
    }

    // Convert PDF to text using PDFLoader with chunking
    console.log('Converting PDF to text');
    const arrayBuffer = await pdfData.arrayBuffer();
    
    try {
      const loader = new PDFLoader(new Blob([arrayBuffer]), {
        splitPages: true // Split PDF into pages to prevent memory issues
      });
      const docs = await loader.load();
      
      // Process pages in chunks to prevent stack overflow
      const chunkSize = 5;
      let pdfText = '';
      
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        pdfText += chunk.map(doc => doc.pageContent).join('\n');
      }
      
      console.log('PDF text extracted successfully');

      // Process with OpenAI
      console.log('Sending request to OpenAI');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: `You are a teaching assistant that helps process lesson plans. 
            Extract the following information from the lesson plan:
            - Title (if not already provided)
            - Learning objectives
            - Duration
            - Required materials
            - Lesson sections with:
              - Section title
              - Duration
              - Content
              - Activities
            
            Format the response as a JSON object matching this TypeScript interface:
            
            interface ProcessedLesson {
              title: string;
              objectives: string[];
              duration: string;
              materials: string[];
              sections: {
                id: string;
                title: string;
                duration: string;
                content: string;
                activities: string[];
              }[];
            }`
          },
          {
            role: 'user',
            content: pdfText
          }
        ],
        response_format: { type: 'json_object' }
      });

      console.log('Received response from OpenAI');
      const processedContent = JSON.parse(completion.choices[0].message.content);
      console.log('Parsed processed content:', { title: processedContent.title });

      // Update lesson plan with processed content
      console.log('Updating lesson plan with processed content');
      const { error: updateError } = await supabase
        .from('lesson_plans')
        .update({ processed_content: processedContent })
        .eq('id', lessonPlanId);

      if (updateError) {
        console.error('Error updating lesson plan:', updateError);
        throw new Error('Failed to update lesson plan');
      }
      console.log('Lesson plan updated successfully');

      return new Response(
        JSON.stringify({ success: true, data: processedContent }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (processingError) {
      if (processingError instanceof RangeError && processingError.message.includes('Maximum call stack size exceeded')) {
        throw new Error('The PDF is too complex to process. Please try uploading a simpler or shorter PDF file.');
      }
      throw processingError;
    }

  } catch (error) {
    console.error('Error processing lesson plan:', error);
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;

    // Provide more specific error messages for common issues
    if (errorMessage.includes('too large') || errorMessage.includes('too complex')) {
      statusCode = 413; // Payload Too Large
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});