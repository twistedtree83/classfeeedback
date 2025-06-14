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

    const prompt = `Expand this brief classroom activity description into a concise, single paragraph with more details for teachers. Keep it brief but informative.

Brief activity: "${activity}"

Consider:
- How the teacher should organize and facilitate the activity
- What students will do during the activity
- What materials might be needed
- Approximately how much time it should take

Make it a simple, straightforward paragraph that provides just enough additional detail for the teacher to understand and implement the activity efficiently. Do NOT create lengthy multi-step instructions or elaborate formatting - just a clear, focused paragraph.

Context: ${subjectContext || "General education"}
Grade level: ${gradeLevel || "Not specified"}`;

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
            content: "You are an expert educator who provides concise, practical activity descriptions for teachers."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300, // Limiting to keep it concise
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
  return `${activity} - For this activity, the teacher should organize students appropriately and provide clear instructions. Students will engage with the content through this structured exercise, developing their understanding and skills. The activity should take approximately 10-15 minutes and requires standard classroom materials. Monitor student progress throughout and provide guidance as needed to ensure learning objectives are met.`;
}