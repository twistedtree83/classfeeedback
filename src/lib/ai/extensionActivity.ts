export async function generateExtensionActivity(
  activity: string,
  lessonTitle?: string,
  gradeLevel?: string
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
    if (!apiKey) {
      console.error("OpenAI API key missing");
      return fallback(activity);
    }

    const prompt = `You are an expert teacher. Craft ONE concise extension activity (fast-finisher task) that deepens thinking based on the given classroom activity. It must be:
- Directly related to the original activity
- Promote higher-order thinking (analysis, creation, evaluation)
- Written as a directive to students
- **Exactly one paragraph**, max 80 words
Return ONLY the paragraph, no title or bullet points.

Lesson title: ${lessonTitle || "General"}
Grade/Level: ${gradeLevel || "Not specified"}
Original activity: ${activity}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert curriculum designer." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 120,
      }),
    });

    if (!res.ok) {
      console.error("Failed to generate extension activity");
      return fallback(activity);
    }
    const data = await res.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "";
    // Keep only first paragraph
    if (text.includes("\n")) {
      text = text.split(/\n+/)[0].trim();
    }
    // Enforce 80-word limit
    const words = text.split(/\s+/);
    if (words.length > 80) {
      text = words.slice(0, 80).join(" ") + "…";
    }
    return text || fallback(activity);
  } catch (e) {
    console.error("Error generating extension activity", e);
    return fallback(activity);
  }
}

function fallback(activity: string) {
  return `Create a variation of \"${activity}\" that challenges you to analyse patterns, justify strategies, and suggest an improvement in one paragraph.`;
}
