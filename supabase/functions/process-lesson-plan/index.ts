import { createClient } from 'npm:@supabase/supabase-js@2.38.4';
import { PDFLoader } from 'npm:@langchain/community@0.0.20/document_loaders/fs/pdf';
import { OpenAI } from 'npm:openai@4.20.1';

// Helper function for consistent log formatting
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    log('Processing lesson plan request');
    const { lessonPlanId } = await req.json();
    log('Lesson plan ID:', lessonPlanId);

    // Initialize clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    log('Supabase client initialized');

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });
    log('OpenAI client initialized');

    // Get lesson plan details
    log('Fetching lesson plan details');
    const { data: lessonPlan, error: fetchError } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', lessonPlanId)
      .single();

    if (fetchError || !lessonPlan) {
      log('Error fetching lesson plan:', { error: fetchError });
      throw new Error('Lesson plan not found');
    }
    log('Lesson plan found:', { id: lessonPlan.id, title: lessonPlan.title });

    // Download PDF from storage
    log('Downloading PDF from storage:', { path: lessonPlan.pdf_path });
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('lesson_plans')
      .download(lessonPlan.pdf_path);

    if (downloadError || !pdfData) {
      log('Error downloading PDF:', { error: downloadError });
      throw new Error('Failed to download PDF');
    }
    log('PDF downloaded successfully');

    // Convert PDF to text
    log('Converting PDF to text using ArrayBuffer');
    const arrayBuffer = await pdfData.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    const pdfText = docs.map(doc => doc.pageContent).join('\n');
    log('PDF converted to text successfully', { textLength: pdfText.length });
    
    if (!pdfText || pdfText.length === 0) {
      throw new Error('Failed to extract text from PDF');
    }

    // Process with OpenAI
    log('Sending request to OpenAI');
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

    log('Received response from OpenAI');
    const processedContent = JSON.parse(completion.choices[0].message.content);
    log('Parsed processed content:', { title: processedContent.title });

    // Update lesson plan with processed content
    log('Updating lesson plan with processed content');
    const { error: updateError } = await supabase
      .from('lesson_plans')
      .update({ processed_content: processedContent })
      .eq('id', lessonPlanId);

    if (updateError) {
      log('Error updating lesson plan:', { error: updateError });
      throw new Error('Failed to update lesson plan');
    }
    log('Lesson plan updated successfully');

    return new Response(
      JSON.stringify({ success: true, data: processedContent }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    log('Error processing lesson plan:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});