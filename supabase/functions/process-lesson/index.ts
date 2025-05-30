import { createClient } from 'npm:@supabase/supabase-js@2.38.4';
import { PDFLoader } from 'npm:langchain/document_loaders/web/pdf';
import { OpenAI } from 'npm:openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lessonPlanId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openai = new OpenAI({
      apiKey: openaiKey
    });

    // Get lesson plan details
    const { data: lessonPlan, error: fetchError } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', lessonPlanId)
      .single();

    if (fetchError || !lessonPlan) {
      throw new Error('Lesson plan not found');
    }

    // Download PDF from storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('lesson_plans')
      .download(lessonPlan.pdf_path);

    if (downloadError || !pdfData) {
      throw new Error('Failed to download PDF');
    }

    // Convert PDF to text
    const arrayBuffer = await pdfData.arrayBuffer();
    let pdfText = '';
    
    try {
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const loader = new PDFLoader(blob);
      const docs = await loader.load();
      pdfText = docs.map(doc => doc.pageContent).join('\n');
    } catch (pdfError) {
      console.error('Error processing PDF:', pdfError);
      throw new Error('Failed to process PDF file');
    }

    // Process with OpenAI
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

    const processedContent = JSON.parse(completion.choices[0].message.content);

    // Update lesson plan with processed content
    const { error: updateError } = await supabase
      .from('lesson_plans')
      .update({ processed_content: processedContent })
      .eq('id', lessonPlanId);

    if (updateError) {
      throw new Error('Failed to update lesson plan');
    }

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