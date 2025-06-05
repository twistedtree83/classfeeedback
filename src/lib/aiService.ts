import { supabase } from './supabase/client';
import { convertUrlsToHyperlinks, processContentWithUrls } from './utils';

const SYSTEM_PROMPT = `You are an expert at analyzing lesson plans and structuring them into clear, organized formats. When given lesson content, break it down into:

1. Title: Keep the provided title
2. Summary: A brief 2-3 sentence overview of what students will learn
3. Duration: Total lesson time (e.g. "45 minutes", "1 hour")
4. Level: The appropriate level for this lesson (e.g. "Beginner", "Grade 3-5", "High School")
5. Learning Objectives: 3-5 specific, measurable objectives starting with action verbs
6. Required Materials: All physical and digital resources needed. If URLs or links are present, preserve them exactly as they appear.
7. Topic Background: Provide factual, contextual information about the main subject of the lesson, tailored to the specified grade level. Include key facts, historical context, or relevant information that would help a teacher present the material confidently. Make this age-appropriate based on the level field.
8. Lesson Sections: Organized teaching segments, each with:
   - Title: Clear section heading
   - Duration: Time allocation
   - Content: Main teaching points and explanations. Preserve all URLs and links exactly as they appear.
   - Activities: Specific exercises or tasks with detailed instructions
   - Assessment: How to check understanding

IMPORTANT: Preserve all URLs, web addresses, and links exactly as they appear in the original text.

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

interface LessonAnalysisResult {
  data: AIResponse;
  improvementAreas: ImprovementArea[];
}

export interface ImprovementArea {
  id: string;
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  type: 'missing' | 'unclear' | 'incomplete';
  fieldPath: string; // e.g., "objectives", "sections.0.activities"
}

export async function aiAnalyzeLesson(content: string, level: string = ''): Promise<LessonAnalysisResult> {
  try {
    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error('OpenAI API key is missing');
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult)
      };
    }
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this lesson plan content for ${level || 'any grade level'}, making sure to extract all important details and preserve any URLs or links: ${content}` }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult)
      };
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid AI response format:', data);
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult)
      };
    }

    try {
      const result = JSON.parse(data.choices[0].message.content);
      const cleanedResult = validateAndCleanResponse(result, level);
      
      // Generate improvement areas for the lesson plan
      const improvementAreas = await identifyActivityImprovementAreas(cleanedResult, apiKey);
      
      return {
        data: cleanedResult,
        improvementAreas
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult)
      };
    }
  } catch (error) {
    console.error('Error analyzing lesson:', error);
    const fallbackResult = fallbackAnalysis(content, level);
    return {
      data: fallbackResult,
      improvementAreas: generateFallbackImprovementAreas(fallbackResult)
    };
  }
}

async function identifyActivityImprovementAreas(lesson: AIResponse, apiKey: string): Promise<ImprovementArea[]> {
  try {
    const lessonJson = JSON.stringify(lesson);
    
    const IMPROVEMENT_PROMPT = `You are a curriculum expert focused specifically on designing engaging and effective student activities for lesson plans. Your task is to review this lesson plan and ONLY identify areas where student activities could be improved.

FOCUS EXCLUSIVELY on activities within each lesson section. Do not suggest improvements for any other aspects of the lesson plan such as learning intentions, success criteria, materials, or topic background.

For each section that needs activity improvements:
1. Identify what's missing, unclear, or incomplete about the ACTIVITIES
2. Explain why better activities would enhance student learning
3. Suggest specific, grade-appropriate activities that align with the lesson objectives
4. Assign a priority (high, medium, low)
5. Categorize the type of issue (missing, unclear, incomplete)

The goal is to help teachers create more engaging, student-centered activities that promote active learning.

Provide your response as a JSON object with an "improvements" field containing an array of improvement areas, with each item having these fields:
- id: A unique string identifier
- section: The specific section title this applies to
- issue: Concise description of what's missing or needs improvement with the activities
- suggestion: Specific, actionable activity suggestions 
- priority: "high", "medium", or "low"
- type: "missing", "unclear", or "incomplete"
- fieldPath: The path to the activities field in the lesson object (e.g., "sections.0.activities", "sections.1.activities")

IMPORTANT: Only suggest improvements for activities, not for any other aspect of the lesson plan.

Lesson plan to analyze: ${lessonJson}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: IMPROVEMENT_PROMPT },
          { role: 'user', content: 'Please analyze this lesson plan and suggest activity improvements only.' }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate improvement suggestions');
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from improvement analysis');
    }

    const improvements = JSON.parse(data.choices[0].message.content);
    return Array.isArray(improvements.improvements) ? improvements.improvements : [];
    
  } catch (error) {
    console.error('Error identifying improvement areas:', error);
    return generateFallbackActivityImprovements(lesson);
  }
}

function generateFallbackActivityImprovements(lesson: AIResponse): ImprovementArea[] {
  const improvements: ImprovementArea[] = [];
  
  // Check each section for activities
  lesson.sections.forEach((section, index) => {
    // Check if activities are missing or sparse
    if (!section.activities || section.activities.length === 0) {
      improvements.push({
        id: `act-missing-${index}`,
        section: `${section.title} Section`,
        issue: 'No activities defined for this section',
        suggestion: 'Add at least two specific activities that engage students actively with the content. Consider including both individual and group activities.',
        priority: 'high',
        type: 'missing',
        fieldPath: `sections.${index}.activities`
      });
    } else if (section.activities.length < 2) {
      improvements.push({
        id: `act-sparse-${index}`,
        section: `${section.title} Section`,
        issue: 'Limited activities for this section',
        suggestion: 'Add more varied activities to engage different learning styles. Consider adding a collaborative or hands-on activity.',
        priority: 'medium',
        type: 'incomplete',
        fieldPath: `sections.${index}.activities`
      });
    } else {
      // Check for vague activities
      const hasVagueActivity = section.activities.some(activity => 
        activity.length < 30 || 
        activity.indexOf(' ') === -1 || 
        /^(discuss|review|complete|do)\s/i.test(activity)
      );
      
      if (hasVagueActivity) {
        improvements.push({
          id: `act-vague-${index}`,
          section: `${section.title} Section`,
          issue: 'Some activities lack specific details or instructions',
          suggestion: 'Expand activity descriptions with clear step-by-step instructions. Include specific questions, prompts, or examples to guide students.',
          priority: 'medium',
          type: 'unclear',
          fieldPath: `sections.${index}.activities`
        });
      }
    }
  });
  
  // If no improvements were found but there are sections, add a suggestion for the first section
  if (improvements.length === 0 && lesson.sections.length > 0) {
    improvements.push({
      id: 'act-general-0',
      section: `${lesson.sections[0].title} Section`,
      issue: 'Activities could be more engaging and student-centered',
      suggestion: 'Consider adding interactive activities like think-pair-share, a short role-play, or a problem-solving challenge to increase student engagement.',
      priority: 'medium',
      type: 'incomplete',
      fieldPath: `sections.0.activities`
    });
  }
  
  return improvements;
}

function generateFallbackImprovementAreas(lesson: AIResponse): ImprovementArea[] {
  return generateFallbackActivityImprovements(lesson);
}

function validateAndCleanResponse(response: any, level: string = ''): AIResponse {
  // Ensure all required fields exist
  const cleaned: AIResponse = {
    title: response.title || 'Untitled Lesson',
    summary: processContentWithUrls(response.summary || 'No summary provided'),
    duration: response.duration || '60 minutes',
    level: response.level || level || 'All Levels',
    objectives: Array.isArray(response.objectives) ? response.objectives : [],
    materials: Array.isArray(response.materials) ? 
      response.materials.map((material: string) => processContentWithUrls(material)) : 
      [],
    topic_background: processContentWithUrls(response.topic_background || generateDefaultTopicBackground(response.title, level)),
    sections: Array.isArray(response.sections) ? response.sections.map((section: any, index: number) => ({
      id: section.id || String(index + 1),
      title: section.title || `Section ${index + 1}`,
      duration: section.duration || '15 minutes',
      content: processContentWithUrls(section.content || 'No content provided'),
      activities: Array.isArray(section.activities) ? 
        section.activities.map((activity: string) => activity) : 
        [],
      assessment: processContentWithUrls(section.assessment || 'Monitor student progress and understanding')
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
    summary: processContentWithUrls(`This lesson covers ${content.slice(0, 100)}...`),
    duration: '60 minutes',
    level: level || 'All Levels',
    objectives: [
      'Understand key concepts from the material',
      'Apply learning to practical examples',
      'Demonstrate comprehension through exercises'
    ],
    materials: ['Lesson handouts', 'Writing materials'],
    topic_background: processContentWithUrls(generateDefaultTopicBackground(title, level)),
    sections: [
      {
        id: '1',
        title: 'Introduction',
        duration: '10 minutes',
        content: processContentWithUrls(paragraphs.slice(0, Math.max(1, Math.floor(paragraphs.length * 0.2))).join('\n\n')),
        activities: ['Class discussion', 'KWL chart'],
        assessment: 'Monitor student participation and initial understanding'
      },
      {
        id: '2',
        title: 'Main Content',
        duration: '40 minutes',
        content: processContentWithUrls(paragraphs.slice(Math.floor(paragraphs.length * 0.2), Math.floor(paragraphs.length * 0.8)).join('\n\n')),
        activities: ['Group work', 'Individual practice'],
        assessment: 'Check work completion and accuracy'
      },
      {
        id: '3',
        title: 'Conclusion',
        duration: '10 minutes',
        content: processContentWithUrls(paragraphs.slice(Math.floor(paragraphs.length * 0.8)).join('\n\n')),
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
    IMPORTANT: Preserve all URLs, web addresses, and links exactly as they appear in the original text.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `This is ${cardType} content intended for ${level || 'students'}. Please adapt it to be student-friendly, preserving all URLs exactly as they appear: ${content}` }
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

    return processContentWithUrls(data.choices[0].message.content.trim());
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
    return processContentWithUrls(`Did you know? ${content}`);
  }
  
  // For other types, just make a simple adjustment
  return processContentWithUrls(content.replace(/students will/gi, 'you will')
    .replace(/students should/gi, 'you should')
    .replace(/the students/gi, 'you')
    .replace(/teachers/gi, 'we'));
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
        model: 'gpt-4.1',
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
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `This is ${cardType} content that students are finding difficult to understand. It's intended for ${level || 'students'}. Please create a differentiated, simpler version while preserving all URLs exactly as they appear: ${content}` }
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

    return processContentWithUrls(data.choices[0].message.content.trim());
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
  return processContentWithUrls(`Let's break this down simply:\n\n${simplifiedSentences.join('. ')}\n\nStill confused? Just remember the main idea: ${sentences[0]}`);
}

export async function improveLessonSection(sectionType: string, currentContent: string, issueDescription: string, level: string = ''): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return currentContent;
    }

    // Specialized prompt focusing on activities
    const systemPrompt = `You are an expert at designing engaging educational activities for students. 
    You will be given:
    1. The type of section being improved
    2. The current content (typically existing activities)
    3. A description of the issue or area needing improvement
    4. The grade level the lesson is designed for
    
    Your task is to provide improved activities that:
    - Are specific, engaging, and grade-level appropriate
    - Include clear step-by-step instructions for implementation
    - Incorporate active learning and student-centered approaches
    - Support the learning objectives of the lesson
    - Promote critical thinking, collaboration, or creativity
    - Can be realistically implemented in a classroom setting
    
    FORMAT YOUR RESPONSE AS A NUMBERED LIST OF DISTINCT ACTIVITIES.
    Each activity should be detailed and specific, not just a general concept.
    
    Focus ONLY on improving student activities, not other aspects of the lesson plan.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `
            Section Type: ${sectionType}
            Grade Level: ${level || 'unspecified'}
            Issue: ${issueDescription}
            
            Current Activities:
            ${currentContent}
            
            Please provide improved activities that address the issue described. Format each activity as a separate numbered item in a list.
          ` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return currentContent;
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid AI response format:', data);
      return currentContent;
    }

    return processContentWithUrls(data.choices[0].message.content.trim());
  } catch (error) {
    console.error('Error improving activities:', error);
    return currentContent;
  }
}