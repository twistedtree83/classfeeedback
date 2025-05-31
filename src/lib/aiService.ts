const SYSTEM_PROMPT = `You are an expert at analyzing lesson plans and structuring them into clear, organized formats. When given lesson content, break it down into:

1. Title: Keep the provided title
2. Summary: A brief 2-3 sentence overview of the lesson
3. Duration: Estimate total lesson time based on content complexity
4. Learning Objectives: Extract 3-5 clear, measurable objectives
5. Required Materials: List all materials mentioned or implied
6. Lesson Sections: Break down into logical parts, each with:
   - Title: Clear section heading
   - Duration: Time allocation
   - Content: Main teaching points and explanations
   - Activities: Specific exercises or tasks
   - Assessment: How to check understanding

Format your response as a JSON object matching the ProcessedLesson type.`;

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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return fallbackAnalysis(content);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze lesson plan');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing lesson:', error);
    return fallbackAnalysis(content);
  }
}

function fallbackAnalysis(content: string): AIResponse {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return {
    title: 'Untitled Lesson',
    summary: content.slice(0, 200) + '...',
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