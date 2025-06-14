import OpenAI from 'openai';

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

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    const prompt = `Expand this brief classroom activity description into detailed teaching instructions:

Brief activity: "${activity}"

Provide a comprehensive expansion that includes:
1. Setup: How to organize the classroom, student grouping, materials needed
2. Procedure: Clear, step-by-step instructions for implementing the activity
3. Variations: Options for different skill levels or learning styles
4. Assessment: How to check student understanding or success

Context: ${subjectContext || "General education"}
Grade level: ${gradeLevel || "Not specified"}

Format the response with clear headings and bullet points for easy reading.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educator who provides detailed, practical activity instructions for teachers."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const result = response.choices[0].message.content;

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
  return `## ${activity}

### Setup
* Organize students into pairs or small groups
* Materials needed: standard classroom equipment
* Clear an appropriate space in the classroom

### Procedure
1. Explain the activity clearly to students
2. Demonstrate the expected actions or outcomes
3. Allow students to practice in pairs or small groups
4. Provide feedback and guidance as students work
5. Wrap up with a whole-class discussion about what was learned

### Variations
* For advanced students: Increase the complexity or speed
* For struggling students: Provide additional support or simplify steps
* Alternative approach: Try a collaborative version of the activity

### Assessment
* Observe students during the activity to assess understanding
* Use peer feedback for additional insights
* Have students reflect on their learning at the end`;
}