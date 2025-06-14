import { sanitizeHtml } from "../utils";

export async function expandActivity(
  activity: string,
  subjectContext?: string,
  gradeLevel?: string
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return generateFallbackExpansion(activity);
    }

    const prompt = `Expand this brief classroom activity description into detailed, step-by-step instructions for teachers to implement. The activity should be educational, engaging, and practical for a classroom setting${
      gradeLevel ? ` at the ${gradeLevel} level` : ""
    }${subjectContext ? ` in the context of ${subjectContext}` : ""}.

Brief activity: "${activity}"

Please provide a detailed expansion that includes:
- Clear preparation instructions (materials, setup, timing)
- Step-by-step implementation guide
- Teacher facilitation notes
- Expected student engagement and learning outcomes
- Optional variations or adaptations for different learning styles or abilities
- Safety considerations (if relevant)

Format your response with markdown using appropriate headers, bullet points, and organization.
Make your answer comprehensive but practical for a real classroom.`;

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
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      console.error("Error expanding activity from AI");
      return generateFallbackExpansion(activity);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return generateFallbackExpansion(activity);
    }

    return result.trim();
  } catch (error) {
    console.error("Error expanding activity:", error);
    return generateFallbackExpansion(activity);
  }
}

function generateFallbackExpansion(activity: string): string {
  return `
## ${activity}

### Preparation
- **Materials needed**: General classroom materials
- **Setup time**: 5-10 minutes
- **Activity duration**: 15-20 minutes

### Implementation Steps
1. **Introduction** (2-3 minutes)
   - Introduce the activity to students
   - Explain the learning objectives
   - Demonstrate if necessary

2. **Main Activity** (10-15 minutes)
   - Have students begin the activity: "${activity}"
   - Monitor progress and provide guidance
   - Encourage student participation and engagement

3. **Wrap-up** (3-5 minutes)
   - Discuss what students learned
   - Connect the activity to learning objectives
   - Provide feedback on student performance

### Variations
- For advanced students: Increase the complexity
- For students who need additional support: Provide more structure

### Learning Outcomes
- Students will practice key concepts
- Students will develop teamwork skills
- Students will demonstrate understanding through application
`;
}