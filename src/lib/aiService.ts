import { supabase } from './supabaseClient';

const SYSTEM_PROMPT = `You are an expert at analyzing lesson plans and structuring them into clear, organized formats. When given lesson content, break it down into:

1. Title: Keep the provided title
2. Summary: A brief 2-3 sentence overview of what students will learn
3. Duration: Total lesson time (e.g. "45 minutes", "1 hour")
4. Level: The appropriate level for this lesson (e.g. "Beginner", "Grade 3-5", "High School")
5. Learning Objectives: 3-5 specific, measurable objectives starting with action verbs
6. Required Materials: All physical and digital resources needed
7. Topic Background: Provide factual, contextual information about the main subject of the lesson, tailored to the specified grade level. Include key facts, historical context, or relevant information that would help a teacher present the material confidently. Make this age-appropriate based on the level field.
8. Lesson Sections: Organized teaching segments, each with:
   - Title: Clear section heading
   - Duration: Time allocation
   - Content: Main teaching points and explanations
   - Activities: Specific exercises or tasks
   - Assessment: How to check understanding

Format your response as a JSON object with these exact fields: title, summary, duration, level, objectives (array), materials (array), topic_background, and sections (array of objects with id, title, duration, content, activities array, and assessment).`;

interface AIResponse {
  title: string;
  summary: string;
  duration: string;
  level: string;
  objectives: string[];
  materials: string[];
  topic_background: string;
  sections: {
    id: string;
    title: string;
    duration: string;
    content: string;
    activities: string[];
    assessment: string;
  }[];
}

export async function aiAnalyzeLesson(content: string, level: string = ''): Promise<AIResponse> {
  try {
    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return fallbackAnalysis(content, level);
    }
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this lesson plan content for ${level || 'any grade level'}: ${content}` }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return fallbackAnalysis(content, level);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid AI response format:', data);
      return fallbackAnalysis(content, level);
    }

    try {
      const result = JSON.parse(data.choices[0].message.content);
      return validateAndCleanResponse(result, level);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return fallbackAnalysis(content, level);
    }
  } catch (error) {
    console.error('Error analyzing lesson:', error);
    return fallbackAnalysis(content, level);
  }
}

function validateAndCleanResponse(response: any, level: string = ''): AIResponse {
  // Ensure all required fields exist
  const cleaned: AIResponse = {
    title: response.title || 'Untitled Lesson',
    summary: response.summary || 'No summary provided',
    duration: response.duration || '60 minutes',
    level: response.level || level || 'All Levels',
    objectives: Array.isArray(response.objectives) ? response.objectives : [],
    materials: Array.isArray(response.materials) ? response.materials : [],
    topic_background: response.topic_background || generateDefaultTopicBackground(response.title, level),
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

function generateDefaultTopicBackground(title: string, level: string = ''): string {
  const gradeLevel = level || 'general education';
  return `This lesson covers fundamental concepts related to ${title}. Teachers may want to review basic principles before presenting this material to students. The content is designed to be accessible to students at the ${gradeLevel} level, focusing on core concepts while building a foundation for future learning.`;
}

function fallbackAnalysis(content: string, level: string = ''): AIResponse {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const title = 'Untitled Lesson';
  
  return {
    title: title,
    summary: `This lesson covers ${content.slice(0, 100)}...`,
    duration: '60 minutes',
    level: level || 'All Levels',
    objectives: [
      'Understand key concepts from the material',
      'Apply learning to practical examples',
      'Demonstrate comprehension through exercises'
    ],
    materials: ['Lesson handouts', 'Writing materials'],
    topic_background: generateDefaultTopicBackground(title, level),
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