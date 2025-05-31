const SYSTEM_PROMPT = `You are an expert at analyzing lesson plans and structuring them into clear, organized formats. When given lesson content, break it down into:

1. Title (if not explicitly provided, derive from content)
2. Duration (estimate based on content)
3. Learning Objectives (3-5 key points)
4. Required Materials
5. Lesson Sections, each containing:
   - Title
   - Duration
   - Content
   - Activities/Exercises

Format your response as a JSON object matching the ProcessedLesson type.`;

interface AIResponse {
  title: string;
  duration: string;
  objectives: string[];
  materials: string[];
  sections: {
    id: string;
    title: string;
    duration: string;
    content: string;
    activities: string[];
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
        activities: ['Class discussion']
      },
      {
        id: '2',
        title: 'Main Content',
        duration: '40 minutes',
        content: paragraphs.slice(Math.floor(paragraphs.length * 0.2), Math.floor(paragraphs.length * 0.8)).join('\n\n'),
        activities: ['Group work', 'Individual practice']
      },
      {
        id: '3',
        title: 'Conclusion',
        duration: '10 minutes',
        content: paragraphs.slice(Math.floor(paragraphs.length * 0.8)).join('\n\n'),
        activities: ['Review', 'Assessment']
      }
    ]
  };
}