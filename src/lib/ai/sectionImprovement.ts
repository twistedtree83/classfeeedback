export async function improveLessonSection(
  sectionType: string,
  currentContent: string,
  issueDescription: string,
  level: string = ""
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return generateFallbackActivities(sectionType, currentContent);
    }

    // Check if this is specifically for activities
    if (issueDescription.toLowerCase().includes("activit")) {
      return await generateStructuredActivities(
        sectionType,
        currentContent,
        issueDescription,
        level,
        apiKey
      );
    }

    // Original generic improvement for non-activity content
    const prompt = `Improve this lesson section based on the identified issue. The section should be engaging, educational, and appropriate for ${
      level || "the target audience"
    }.

Section Type: ${sectionType}
Current Content: ${currentContent}
Issue to Address: ${issueDescription}

Please provide an improved version that:
- Addresses the specific issue mentioned
- Maintains educational value and alignment with learning objectives
- Is appropriate for the specified level
- Includes clear instructions and engaging activities
- Is practical for classroom implementation

Return only the improved content, no additional explanations or formatting.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("Error improving lesson section from AI");
      return currentContent;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return currentContent;
    }

    return result.trim();
  } catch (error) {
    console.error("Error improving lesson section:", error);
    return currentContent;
  }
}

async function generateStructuredActivities(
  sectionType: string,
  currentContent: string,
  issueDescription: string,
  level: string,
  apiKey: string
): Promise<string> {
  const prompt = `You are a curriculum expert specializing in creating engaging student activities. Generate 3-4 specific, actionable activities for this lesson section.

Section: ${sectionType}
Current Activities: ${currentContent || "None provided"}
Issue to Address: ${issueDescription}
Student Level: ${level || "General"}

Create activities that:
- Are directly related to the lesson objectives
- Include clear step-by-step instructions
- Specify materials needed (if any)
- Indicate approximate duration
- Suggest appropriate grouping (individual, pairs, small groups, whole class)
- Are engaging and age-appropriate
- Promote active learning and student participation

IMPORTANT: Respond with ONLY a JSON object in this exact format:
{
  "activities": [
    {
      "title": "Clear, descriptive activity name",
      "description": "Detailed step-by-step instructions for the activity. Include what students will do, how they will do it, and what the expected outcome is.",
      "duration": "X-Y minutes",
      "materials": "List of materials needed",
      "grouping": "Individual/Pairs/Small groups/Whole class"
    }
  ]
}

Do not include any text outside of the JSON object.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a curriculum expert who creates engaging educational activities. Always respond with valid JSON in the exact format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Error generating structured activities from AI");
      return generateFallbackActivities(sectionType, currentContent);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return generateFallbackActivities(sectionType, currentContent);
    }

    // Validate JSON structure
    try {
      const parsed = JSON.parse(result);
      if (
        parsed.activities &&
        Array.isArray(parsed.activities) &&
        parsed.activities.length > 0
      ) {
        return result;
      } else {
        throw new Error("Invalid JSON structure");
      }
    } catch (parseError) {
      console.error("Failed to parse AI activity response:", parseError);
      return generateFallbackActivities(sectionType, currentContent);
    }
  } catch (error) {
    console.error("Error in generateStructuredActivities:", error);
    return generateFallbackActivities(sectionType, currentContent);
  }
}

function generateFallbackActivities(
  sectionType: string,
  currentContent: string
): string {
  const fallbackActivities = [
    {
      title: "Interactive Discussion",
      description: `Lead a whole-class discussion about the key concepts in ${sectionType}. Ask open-ended questions to encourage student participation and check understanding. Students should be able to share their thoughts and build on each other's ideas.`,
      duration: "10-15 minutes",
      materials: "Whiteboard or chart paper",
      grouping: "Whole class",
    },
    {
      title: "Think-Pair-Share",
      description: `Students first think individually about a question related to ${sectionType}, then pair up to discuss their ideas, and finally share their conclusions with the larger group. This promotes both individual reflection and collaborative learning.`,
      duration: "8-12 minutes",
      materials: "Question prompts, paper for notes",
      grouping: "Individual, then pairs, then whole class",
    },
    {
      title: "Hands-on Practice",
      description: `Students work in small groups to apply the concepts from ${sectionType} through a practical exercise. Provide clear instructions and circulate to offer guidance and feedback as needed.`,
      duration: "15-20 minutes",
      materials: "Activity worksheets, manipulatives as needed",
      grouping: "Small groups (3-4 students)",
    },
  ];

  return JSON.stringify({ activities: fallbackActivities });
}
