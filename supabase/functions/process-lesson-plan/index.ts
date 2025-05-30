// @deno-types="npm:@types/node@20.11.25"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { PDFLoader } from 'https://esm.sh/@langchain/community@0.0.20/document_loaders/fs/pdf';
import { OpenAI } from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processing lesson plan request');
    const { lessonPlanId } = await req.json();
    console.log('Lesson plan ID:', lessonPlanId);

    if (!lessonPlanId) {
      throw new Error('Lesson plan ID is required');
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
    console.log('Downloading PDF from storage:', { path: lessonPlan.pdf_path });
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('lesson_plans')
      .download(lessonPlan.pdf_path);

    if (downloadError || !pdfData) {
      console.error('Error downloading PDF:', downloadError);
      throw new Error('Failed to download PDF');
    }
    console.log('PDF downloaded successfully');

    // Convert PDF to text
    console.log('Converting PDF to text');
    const arrayBuffer = await pdfData.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    const pdfText = docs.map(doc => doc.pageContent).join('\n');
    console.log('PDF converted to text successfully', { textLength: pdfText.length });
    
    if (!pdfText || pdfText.length === 0) {
      throw new Error('Failed to extract text from PDF');
    }

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
          'Content-Type': 'application/json'
        }
      }
    );
  }
});