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

export interface ImprovementArea {
  id: string;
  section: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  type: "missing" | "unclear" | "incomplete";
  fieldPath: string; // e.g., "objectives", "sections.0.activities"
}

interface LessonAnalysisResult {
  data: AIResponse;
  improvementAreas: ImprovementArea[];
}

export async function aiAnalyzeLesson(
  content: string,
  level: string = ""
): Promise<LessonAnalysisResult> {
  try {
    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult),
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this lesson plan content for ${
              level || "any grade level"
            }, making sure to extract all important details and preserve any URLs or links: ${content}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult),
      };
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid AI response format:", data);
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult),
      };
    }

    try {
      const result = JSON.parse(data.choices[0].message.content);
      const cleanedResult = validateAndCleanResponse(result, level);

      // Generate improvement areas for the lesson plan
      const improvementAreas = await identifyActivityImprovementAreas(
        cleanedResult,
        apiKey
      );

      return {
        data: cleanedResult,
        improvementAreas,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      const fallbackResult = fallbackAnalysis(content, level);
      return {
        data: fallbackResult,
        improvementAreas: generateFallbackImprovementAreas(fallbackResult),
      };
    }
  } catch (error) {
    console.error("Error analyzing lesson:", error);
    const fallbackResult = fallbackAnalysis(content, level);
    return {
      data: fallbackResult,
      improvementAreas: generateFallbackImprovementAreas(fallbackResult),
    };
  }
}

async function identifyActivityImprovementAreas(
  lesson: AIResponse,
  apiKey: string
): Promise<ImprovementArea[]> {
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: IMPROVEMENT_PROMPT },
          {
            role: "user",
            content:
              "Please analyze this lesson plan and suggest activity improvements only.",
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Error getting improvement suggestions from AI");
      return generateFallbackActivityImprovements(lesson);
    }

    const data = await response.json();
    const improvements = JSON.parse(data.choices[0].message.content);

    if (improvements.improvements && Array.isArray(improvements.improvements)) {
      return improvements.improvements;
    } else {
      return generateFallbackActivityImprovements(lesson);
    }
  } catch (error) {
    console.error("Error identifying improvement areas:", error);
    return generateFallbackActivityImprovements(lesson);
  }
}

function generateFallbackActivityImprovements(
  lesson: AIResponse
): ImprovementArea[] {
  const improvements: ImprovementArea[] = [];

  lesson.sections.forEach((section, index) => {
    if (!section.activities || section.activities.length === 0) {
      improvements.push({
        id: `activity_${index}_missing`,
        section: section.title,
        issue: "No student activities provided for this section",
        suggestion:
          "Add 2-3 engaging activities that allow students to practice and apply the concepts being taught. Consider interactive exercises, group work, or hands-on tasks.",
        priority: "high",
        type: "missing",
        fieldPath: `sections.${index}.activities`,
      });
    } else if (section.activities.length === 1) {
      improvements.push({
        id: `activity_${index}_limited`,
        section: section.title,
        issue: "Only one activity provided - could benefit from variety",
        suggestion:
          "Add 1-2 additional activities with different learning styles in mind (visual, auditory, kinesthetic) to engage all students.",
        priority: "medium",
        type: "incomplete",
        fieldPath: `sections.${index}.activities`,
      });
    }
  });

  return improvements;
}

function generateFallbackImprovementAreas(
  lesson: AIResponse
): ImprovementArea[] {
  return generateFallbackActivityImprovements(lesson);
}

function validateAndCleanResponse(
  response: any,
  level: string = ""
): AIResponse {
  const cleaned: AIResponse = {
    title: response.title || "Untitled Lesson",
    summary:
      response.summary ||
      "A lesson designed to help students learn new concepts.",
    duration: response.duration || "45 minutes",
    level: response.level || level || "General",
    objectives: Array.isArray(response.objectives)
      ? response.objectives.filter((obj: any) => typeof obj === "string")
      : [],
    materials: Array.isArray(response.materials)
      ? response.materials.filter((mat: any) => typeof mat === "string")
      : [],
    topic_background:
      response.topic_background ||
      generateDefaultTopicBackground(response.title || "Lesson Topic", level),
    sections: Array.isArray(response.sections)
      ? response.sections.map((section: any, index: number) => ({
          id: section.id || `section_${index}`,
          title: section.title || `Section ${index + 1}`,
          duration: section.duration || "10 minutes",
          content: section.content || "Content to be covered in this section.",
          activities: Array.isArray(section.activities)
            ? section.activities.filter((act: any) => typeof act === "string")
            : [],
          assessment:
            section.assessment ||
            "Check student understanding through observation.",
        }))
      : [],
  };

  return cleaned;
}

function generateDefaultTopicBackground(
  title: string,
  level: string = ""
): string {
  return `This lesson on "${title}" provides students with essential knowledge and skills. The content is designed to be ${
    level ? `appropriate for ${level} students` : "age-appropriate"
  } and builds upon previous learning experiences.`;
}

function fallbackAnalysis(content: string, level: string = ""): AIResponse {
  const lines = content.split("\n").filter((line) => line.trim());

  // Try to extract title from first line or content
  const title = lines[0]?.replace(/^#\s*/, "") || "Lesson Plan";

  // Basic parsing attempt
  const objectiveKeywords = ["objective", "goal", "aim", "target", "outcome"];
  const materialKeywords = [
    "material",
    "resource",
    "equipment",
    "tool",
    "supply",
  ];

  const objectives: string[] = [];
  const materials: string[] = [];
  const sections: any[] = [];

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();

    // Check for objectives
    if (objectiveKeywords.some((keyword) => lowerLine.includes(keyword))) {
      if (line.includes(":")) {
        const parts = line.split(":");
        if (parts.length > 1) {
          objectives.push(parts[1].trim());
        }
      }
    }

    // Check for materials
    if (materialKeywords.some((keyword) => lowerLine.includes(keyword))) {
      if (line.includes(":")) {
        const parts = line.split(":");
        if (parts.length > 1) {
          materials.push(parts[1].trim());
        }
      }
    }

    // Create sections from headers or significant content
    if (line.startsWith("#") || line.length > 50) {
      sections.push({
        id: `section_${sections.length}`,
        title: line.startsWith("#")
          ? line.replace(/^#+\s*/, "")
          : `Section ${sections.length + 1}`,
        duration: "10 minutes",
        content: line.startsWith("#") ? "Content for this section." : line,
        activities: ["Student activity to be defined"],
        assessment: "Observe student participation and understanding",
      });
    }
  });

  // Ensure we have at least one section
  if (sections.length === 0) {
    sections.push({
      id: "section_0",
      title: "Main Content",
      duration: "30 minutes",
      content: content.substring(0, 200) + "...",
      activities: ["Interactive discussion", "Practice exercise"],
      assessment: "Check understanding through questioning",
    });
  }

  return {
    title,
    summary: `This lesson covers ${title.toLowerCase()} with practical activities and assessments.`,
    duration: "45 minutes",
    level: level || "General",
    objectives:
      objectives.length > 0
        ? objectives
        : [
            "Students will understand key concepts",
            "Students will apply learned skills",
          ],
    materials:
      materials.length > 0
        ? materials
        : ["Whiteboard", "Handouts", "Writing materials"],
    topic_background: generateDefaultTopicBackground(title, level),
    sections,
  };
}
