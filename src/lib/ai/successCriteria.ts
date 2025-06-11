export async function generateSuccessCriteria(
  objectives: string[],
  level: string = ""
): Promise<string[]> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return defaultSuccessCriteria(objectives);
    }

    const objectivesText = objectives.join("\n");

    const prompt = `Based on these learning objectives, generate 3-5 clear, specific, and measurable success criteria that students and teachers can use to determine if the objectives have been achieved. The success criteria should be written in student-friendly language${
      level ? ` appropriate for ${level}` : ""
    }.

Learning Objectives:
${objectivesText}

Success criteria should:
- Be specific and measurable
- Use "I can..." statements where appropriate
- Be achievable within the lesson timeframe
- Help students self-assess their learning
- Be clear enough for teachers to observe and assess

Format each criterion as a separate line starting with "• " or "I can..."

Return only the success criteria, no additional text or explanations.`;

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
      console.error("Error generating success criteria from AI");
      return defaultSuccessCriteria(objectives);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return defaultSuccessCriteria(objectives);
    }

    // Parse the response into individual criteria
    const criteria = result
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => {
        // Remove bullet points or numbers from the beginning
        return line.replace(/^[•\-\*\d]+\.?\s*/, "");
      })
      .filter((criterion: string) => criterion.length > 10); // Filter out very short lines

    return criteria.length > 0 ? criteria : defaultSuccessCriteria(objectives);
  } catch (error) {
    console.error("Error generating success criteria:", error);
    return defaultSuccessCriteria(objectives);
  }
}

function defaultSuccessCriteria(objectives: string[]): string[] {
  return objectives.map((objective, index) => {
    // Convert objectives to "I can" statements
    let criterion = objective.toLowerCase();

    // Remove common objective starters
    criterion = criterion
      .replace(/^(students will|learners will|participants will)\s*/i, "")
      .replace(/^(understand|learn|know|be able to)\s*/i, "");

    // Make it an "I can" statement
    criterion = `I can ${criterion}`;

    // Capitalize first letter after "I can"
    criterion = criterion.replace(/^i can\s+(\w)/, (match, firstLetter) => {
      return `I can ${firstLetter.toUpperCase()}`;
    });

    return criterion;
  });
}
