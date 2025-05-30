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
    const { title, content } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });
    log('OpenAI client initialized');

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
          content: content
        }
      ],
      response_format: { type: 'json_object' }
    });

    log('Received response from OpenAI');
    const processedContent = JSON.parse(completion.choices[0].message.content);
    
    // Override the title if provided
    if (title) {
      processedContent.title = title;
    }
    
    log('Processed content:', { title: processedContent.title });

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