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
      const improvementAreas = await identifyImprovementAreas(cleanedResult, apiKey);
      
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

async function identifyImprovementAreas(lesson: AIResponse, apiKey: string): Promise<ImprovementArea[]> {
  try {
    const lessonJson = JSON.stringify(lesson);
    
    const IMPROVEMENT_PROMPT = `You are a curriculum expert reviewing a teacher's lesson plan. Analyze this lesson plan and identify 3-5 specific areas that could be improved or need more details.

For each area needing improvement:
1. Identify specifically what is missing, unclear, or incomplete
2. Explain why this is important for effective teaching
3. Provide a specific suggestion for improvement
4. Assign a priority (high, medium, low)
5. Categorize the type of issue (missing, unclear, incomplete)

DO NOT suggest adding completely new sections or major restructuring.
DO focus on enriching and clarifying what's already there.
The goal is to help the teacher make targeted improvements to their existing plan.

Provide your response as a JSON array of improvement areas, with each item having these fields:
- id: A unique string identifier
- section: The specific part of the lesson plan this applies to (e.g., "Learning Objectives", "Introduction Section")
- issue: Concise description of what's missing or needs improvement
- suggestion: Specific, actionable suggestion for improvement
- priority: "high", "medium", or "low"
- type: "missing", "unclear", or "incomplete"
- fieldPath: The path to the field in the lesson object (e.g., "objectives", "sections.0.activities")

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
          { role: 'user', content: 'Please analyze this lesson plan and suggest improvements.' }
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
    return generateFallbackImprovementAreas(lesson);
  }
}

function generateFallbackImprovementAreas(lesson: AIResponse): ImprovementArea[] {
  const improvements: ImprovementArea[] = [];
  
  // Check for objectives
  if (!lesson.objectives || lesson.objectives.length < 3) {
    improvements.push({
      id: 'obj-1',
      section: 'Learning Objectives',
      issue: 'Not enough specific learning objectives',
      suggestion: 'Add more measurable objectives that start with action verbs like "explain", "demonstrate", or "analyze"',
      priority: 'high',
      type: 'incomplete',
      fieldPath: 'objectives'
    });
  }
  
  // Check for materials
  if (!lesson.materials || lesson.materials.length < 2) {
    improvements.push({
      id: 'mat-1',
      section: 'Materials',
      issue: 'Limited materials list',
      suggestion: 'Expand the list of materials needed for this lesson, including both physical and digital resources',
      priority: 'medium',
      type: 'incomplete',
      fieldPath: 'materials'
    });
  }
  
  // Check for topic background
  if (!lesson.topic_background || lesson.topic_background.length < 100) {
    improvements.push({
      id: 'bg-1',
      section: 'Topic Background',
      issue: 'Limited background information for the teacher',
      suggestion: 'Add more context about the topic to help the teacher present with confidence',
      priority: 'medium',
      type: 'incomplete',
      fieldPath: 'topic_background'
    });
  }
  
  // Check for sections
  if (lesson.sections.length < 2) {
    improvements.push({
      id: 'sec-1',
      section: 'Lesson Structure',
      issue: 'Not enough lesson sections',
      suggestion: 'Break the lesson into more distinct sections (e.g., Introduction, Main Activity, Conclusion)',
      priority: 'high',
      type: 'incomplete',
      fieldPath: 'sections'
    });
  } else {
    // Check for activities in the first section
    const firstSection = lesson.sections[0];
    if (!firstSection.activities || firstSection.activities.length === 0) {
      improvements.push({
        id: 'act-1',
        section: `${firstSection.title} Section`,
        issue: 'No activities defined for this section',
        suggestion: 'Add at least one specific activity or task for students to complete',
        priority: 'high',
        type: 'missing',
        fieldPath: `sections.0.activities`
      });
    }
    
    // Check for assessment
    if (!firstSection.assessment || firstSection.assessment.length < 50) {
      improvements.push({
        id: 'ass-1',
        section: `${firstSection.title} Section`,
        issue: 'Limited assessment details',
        suggestion: 'Add specific methods to check student understanding during or after this section',
        priority: 'medium',
        type: 'incomplete',
        fieldPath: `sections.0.assessment`
      });
    }
  }
  
  return improvements;
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
        activities: ['Class discussion'],
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

    const systemPrompt = `You are an expert curriculum designer helping a teacher improve a specific part of their lesson plan.
    You will be given:
    1. The type of section being improved (e.g., "Learning Objectives", "Topic Background")
    2. The current content for that section
    3. A description of the issue or area needing improvement
    4. The grade level the lesson is designed for
    
    Your task is to provide an improved version of this section that:
    - Addresses the specific issue described
    - Maintains the original intent and core content
    - Is appropriate for the specified grade level
    - Is well-structured and clearly written
    - Preserves any URLs or links exactly as they appear
    
    Do NOT completely rewrite the section - build upon and enhance what the teacher has already created.
    Do NOT add content unrelated to the original section's purpose.
    Do NOT change the overall direction of the lesson.
    
    Focus on specific, targeted improvements to address the issue described.`;
    
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
            
            Current Content:
            ${currentContent}
            
            Please provide an improved version of this section that addresses the issue described.
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
    console.error('Error improving lesson section:', error);
    return currentContent;
  }
}