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
      return currentContent; // Return original content if no API key
    }

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
      return currentContent; // Return original if API fails
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return currentContent; // Return original if no result
    }

    return result.trim();
  } catch (error) {
    console.error("Error improving lesson section:", error);
    return currentContent; // Return original if error occurs
  }
}
