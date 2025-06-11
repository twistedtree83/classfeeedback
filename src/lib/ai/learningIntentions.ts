export async function improveLearningIntentions(
  objectives: string[],
  level: string = ""
): Promise<string[]> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return objectives; // Return original if no API key
    }

    const objectivesText = objectives.join("\n");

    const prompt = `Improve these learning objectives to make them clearer, more specific, and better aligned with best practices for lesson planning. The improved objectives should be measurable, achievable, and appropriate for ${
      level || "the target audience"
    }.

Current objectives:
${objectivesText}

Guidelines for improvement:
- Use specific action verbs (analyze, create, evaluate, etc.) rather than vague ones (understand, learn, know)
- Make them measurable and observable
- Ensure they're achievable within a single lesson
- Write them from the student's perspective when possible
- Make them clear and specific about what students will accomplish
- Keep the same intent but improve clarity and specificity

Return only the improved objectives, one per line, without additional explanations or formatting.`;

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
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.error("Error improving learning intentions from AI");
      return objectives; // Return original if API fails
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return objectives; // Return original if no result
    }

    // Parse the response into individual objectives
    const improvedObjectives = result
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => {
        // Remove bullet points or numbers from the beginning
        return line.replace(/^[•\-\*\d]+\.?\s*/, "");
      })
      .filter((objective: string) => objective.length > 10); // Filter out very short lines

    return improvedObjectives.length > 0 ? improvedObjectives : objectives;
  } catch (error) {
    console.error("Error improving learning intentions:", error);
    return objectives; // Return original if error occurs
  }
}
