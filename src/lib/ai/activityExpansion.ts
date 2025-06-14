/**
 * Expands a brief activity description into detailed teaching instructions
 */
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

    const prompt = `You are an expert teacher. Rewrite the given classroom activity as a concise, high-level directive for students who finish early.  Requirements:
• Must build on the original activity and promote higher-order thinking.
• Write as an instruction to students (imperative mood).
• ONE paragraph only, maximum 80 words.  No headings, no bullets.

Lesson/Context: ${subjectContext || "General"}
Grade level: ${gradeLevel || "Not specified"}
Original activity: "${activity}"`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educator who provides detailed, practical activity instructions for teachers.",
          },
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
      console.error("Error expanding activity from AI");
      return generateFallbackExpansion(activity);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim() || "";
    if (result.includes("\n")) {
      result = result.split(/\n+/)[0].trim();
    }
    const words = result.split(/\s+/);
    if (words.length > 80) {
      result = words.slice(0, 80).join(" ") + "…";
    }

    return result || generateFallbackExpansion(activity);
  } catch (error) {
    console.error("Error expanding activity:", error);
    return generateFallbackExpansion(activity);
  }
}

function generateFallbackExpansion(activity: string): string {
  return `Extend the task "${activity}" by challenging yourself to analyse the strategy you used, explain why it works, and propose an improvement—all in one short paragraph.`;
}
