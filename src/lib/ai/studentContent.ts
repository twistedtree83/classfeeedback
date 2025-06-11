export async function makeContentStudentFriendly(
  content: string,
  cardType: string,
  level: string = ""
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return defaultStudentFriendlyContent(content, cardType);
    }

    const prompt = `Transform this ${cardType} content into student-friendly language that is clear, engaging, and appropriate for ${
      level || "students"
    }. Keep the key information but make it more accessible and interesting for students to read.

Original content: ${content}

Make it:
- Clear and easy to understand
- Engaging and interesting for students
- Age-appropriate for ${level || "the target audience"}
- Preserve any important technical terms but explain them simply
- Keep the same structure but improve readability

Return only the improved content, no additional formatting or explanations.`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error");
      return defaultStudentFriendlyContent(content, cardType);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return defaultStudentFriendlyContent(content, cardType);
    }

    return result.trim();
  } catch (error) {
    console.error("Error making content student-friendly:", error);
    return defaultStudentFriendlyContent(content, cardType);
  }
}

function defaultStudentFriendlyContent(
  content: string,
  cardType: string
): string {
  // Simple fallback transformations
  let studentFriendly = content;

  // Replace academic language with simpler terms
  const replacements = [
    ["utilize", "use"],
    ["demonstrate", "show"],
    ["comprehend", "understand"],
    ["identify", "find"],
    ["analyze", "look at carefully"],
    ["evaluate", "decide if it's good"],
    ["synthesize", "put together"],
    ["implement", "use"],
    ["facilitate", "help"],
    ["objective", "goal"],
  ];

  replacements.forEach(([formal, simple]) => {
    const regex = new RegExp(`\\b${formal}\\b`, "gi");
    studentFriendly = studentFriendly.replace(regex, simple);
  });

  // Add encouraging language for certain card types
  if (cardType === "objective") {
    studentFriendly = "🎯 " + studentFriendly;
  } else if (cardType === "activity") {
    studentFriendly = "🎲 " + studentFriendly;
  }

  return studentFriendly;
}
