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

/**
 * Converts plaintext URLs in a string to HTML hyperlinks
 */
function convertUrlsToHyperlinks(text: string): string {
  if (!text) return text;
  
  // Regex to match URLs (handles http, https, ftp, www)
  const urlRegex = /(https?:\/\/|www\.)[^\s<>]+\.[^\s<>]+/g;
  
  // Replace URLs with hyperlinks
  return text.replace(urlRegex, (url) => {
    // Add protocol if missing
    const href = url.startsWith('www.') ? `https://${url}` : url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline">${url}</a>`;
  });
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
    summary: convertUrlsToHyperlinks(response.summary || 'No summary provided'),
    duration: response.duration || '60 minutes',
    level: response.level || level || 'All Levels',
    objectives: Array.isArray(response.objectives) ? response.objectives : [],
    materials: Array.isArray(response.materials) ? response.materials : [],
    topic_background: convertUrlsToHyperlinks(response.topic_background || generateDefaultTopicBackground(response.title, level)),
    sections: Array.isArray(response.sections) ? response.sections.map((section: any, index: number) => ({
      id: section.id || String(index + 1),
      title: section.title || `Section ${index + 1}`,
      duration: section.duration || '15 minutes',
      content: convertUrlsToHyperlinks(section.content || 'No content provided'),
      activities: Array.isArray(section.activities) ? 
        section.activities.map((activity: string) => convertUrlsToHyperlinks(activity)) : 
        [],
      assessment: convertUrlsToHyperlinks(section.assessment || 'Monitor student progress and understanding')
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

export async function makeContentStudentFriendly(content: string, cardType: string, level: string = ''): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return defaultStudentFriendlyContent(content, cardType);
    }

    const systemPrompt = `You are an expert at adapting teacher materials into student-friendly content. 
    Make the content more engaging, accessible, and appropriate for students. 
    Adjust language, remove teacher-specific notes, and present information in a clear, friendly way.
    For Learning Intentions, transform the objectives into "I can" statements.
    If the content includes Success Criteria, make these clear, specific, and achievable.
    Maintain all important educational content but make it directly address the student.
    For Topic Background, include only the most interesting and relevant facts that will engage students.
    Preserve any URLs and website links in the content.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `This is ${cardType} content intended for ${level || 'students'}. Please adapt it to be student-friendly: ${content}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return defaultStudentFriendlyContent(content, cardType);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid AI response format:', data);
      return defaultStudentFriendlyContent(content, cardType);
    }

    return convertUrlsToHyperlinks(data.choices[0].message.content.trim());
  } catch (error) {
    console.error('Error making content student-friendly:', error);
    return defaultStudentFriendlyContent(content, cardType);
  }
}

function defaultStudentFriendlyContent(content: string, cardType: string): string {
  if (cardType === 'objective') {
    const objectives = content.split('\n').map(line => {
      // Convert each line to an "I can" statement
      const bulletRemoved = line.replace(/^[•\-*]\s*/, '');
      if (bulletRemoved.startsWith('I can')) {
        return bulletRemoved;
      }
      return `I can ${bulletRemoved.charAt(0).toLowerCase() + bulletRemoved.slice(1)}`;
    });
    return objectives.join('\n');
  }
  
  if (cardType === 'topic_background') {
    return `Did you know? ${content}`;
  }
  
  // For other types, just make a simple adjustment
  return content.replace(/students will/gi, 'you will')
    .replace(/students should/gi, 'you should')
    .replace(/the students/gi, 'you')
    .replace(/teachers/gi, 'we');
}

export async function generateSuccessCriteria(objectives: string[], level: string = ''): Promise<string[]> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    
    if (!apiKey || objectives.length === 0) {
      console.error('OpenAI API key is missing or no objectives provided');
      return defaultSuccessCriteria(objectives);
    }

    const systemPrompt = `You are an expert at creating clear success criteria from learning objectives.
    For each learning objective, create 1-2 specific, measurable success criteria that would help students 
    understand exactly what successful completion looks like.
    Format each as a simple statement starting with "I can" or "I am able to".
    Make the criteria appropriate for the specified grade level.
    Ensure criteria are concrete and observable actions or products.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `For these learning objectives intended for ${level || 'students'}, generate appropriate success criteria:\n\n${objectives.join('\n')}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return defaultSuccessCriteria(objectives);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid AI response format:', data);
      return defaultSuccessCriteria(objectives);
    }

    const criteriaText = data.choices[0].message.content.trim();
    // Parse the response into an array of criteria
    const criteria = criteriaText.split(/\n+/).filter(line => 
      line.trim().length > 0 && 
      !line.trim().match(/^[0-9]+\.?\s*$/) && // Remove numbered lines with no content
      !line.trim().match(/success criteria/i) // Remove headers
    );
    
    return criteria;
  } catch (error) {
    console.error('Error generating success criteria:', error);
    return defaultSuccessCriteria(objectives);
  }
}

function defaultSuccessCriteria(objectives: string[]): string[] {
  return objectives.map(objective => {
    const bulletRemoved = objective.replace(/^[•\-*]\s*/, '');
    return `I can demonstrate that I ${bulletRemoved.charAt(0).toLowerCase() + bulletRemoved.slice(1)}`;
  });
}

export async function generateDifferentiatedContent(content: string, cardType: string, level: string = ''): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return defaultDifferentiatedContent(content, cardType);
    }

    const systemPrompt = `You are an expert at differentiating educational content for students who need additional support.
    Simplify complex concepts without losing the core meaning.
    Use clearer, more concrete language with examples that relate to everyday experiences.
    Break down multi-step processes into smaller steps.
    Use simpler vocabulary while maintaining academic integrity.
    Include visual cues through text (like "Picture this:" or "Imagine that:").
    For learning objectives, make them more specific and achievable.
    Preserve all URLs and links in their original form.
    Your goal is to make the content accessible to students who find the original difficult to understand.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `This is ${cardType} content that students are finding difficult to understand. It's intended for ${level || 'students'}. Please create a differentiated, simpler version: ${content}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return defaultDifferentiatedContent(content, cardType);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid AI response format:', data);
      return defaultDifferentiatedContent(content, cardType);
    }

    return convertUrlsToHyperlinks(data.choices[0].message.content.trim());
  } catch (error) {
    console.error('Error generating differentiated content:', error);
    return defaultDifferentiatedContent(content, cardType);
  }
}

function defaultDifferentiatedContent(content: string, cardType: string): string {
  // Create a simplified version with more basic language
  if (cardType === 'objective') {
    const objectives = content.split('\n').map(line => {
      const bulletRemoved = line.replace(/^[•\-*]\s*/, '');
      return `• I can ${bulletRemoved.toLowerCase()}. This means I will be able to...`;
    });
    return objectives.join('\n');
  }
  
  // For other types, make a simplified version
  const sentences = content.split('. ');
  const simplifiedSentences = sentences.map(sentence => {
    // Shorten long sentences
    if (sentence.length > 80) {
      return sentence.substring(0, 80) + '...';
    }
    return sentence;
  });
  
  // Add helper text at the beginning
  return `Let's break this down simply:\n\n${simplifiedSentences.join('. ')}\n\nStill confused? Just remember the main idea: ${sentences[0]}`;
}