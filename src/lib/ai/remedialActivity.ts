/**
 * Generates a remedial (simplified) version of an activity for students who need additional support
 */
export async function generateRemedialActivity(
  activityContent: string,
  cardType: string,
  level: string = ""
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return generateFallbackRemedial(activityContent, cardType);
    }

    const prompt = `You are an expert inclusive education specialist who creates simplified, accessible content for students who need learning support.

Transform the following ${cardType} content into a more accessible format for students who need additional support.
The original content is designed for ${level || "middle school"} students, but your task is to create a version that is:

1. More explicit and direct
2. Uses simpler vocabulary
3. Has shorter sentences
4. Includes step-by-step instructions when appropriate
5. Focuses on the essential concepts only
6. Provides concrete examples
7. Avoids abstract language or metaphors
8. Uses visual cues like bullet points or numbering
9. Is suitable for students who may have learning disabilities or language barriers

Original content:
${activityContent}

IMPORTANT GUIDELINES:
- Maintain the core learning intentions
- Be respectful and age-appropriate (avoid infantilizing the content)
- Include reasonable adjustments such as suggesting speaking instead of writing
- Keep the same general topic and focus
- Make the content more accessible without removing the key learning

Format your response with clear structure, bullet points, or numbering where appropriate.
Return only the simplified content, no additional explanations or notes.`;

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
      console.error("Error generating remedial activity from AI");
      return generateFallbackRemedial(activityContent, cardType);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return generateFallbackRemedial(activityContent, cardType);
    }

    return result.trim();
  } catch (error) {
    console.error("Error generating remedial activity:", error);
    return generateFallbackRemedial(activityContent, cardType);
  }
}

/**
 * Fallback function to generate a basic remedial version if AI fails
 */
function generateFallbackRemedial(
  activityContent: string,
  cardType: string
): string {
  // Create a simpler version of the content with basic modifications
  let simplifiedContent = activityContent;
  
  // Replace complex terms with simpler ones
  const replacements = [
    ["analyze", "look at"],
    ["evaluate", "decide if it's good"],
    ["synthesize", "put together"],
    ["implement", "use"],
    ["collaborate", "work together"],
    ["investigate", "find out about"],
    ["demonstrate", "show"],
    ["illustrate", "draw or explain"],
    ["comprehend", "understand"],
  ];
  
  for (const [complex, simple] of replacements) {
    const regex = new RegExp(`\\b${complex}\\b`, "gi");
    simplifiedContent = simplifiedContent.replace(regex, simple);
  }
  
  // Add simplified introduction based on card type
  const intro = cardType === "activity" 
    ? "**Simplified Activity Instructions:**\n\n" 
    : "**Simplified Version:**\n\n";
    
  // Break into shorter sentences if content is long
  if (simplifiedContent.length > 100) {
    simplifiedContent = simplifiedContent
      .replace(/\.\s+/g, ".\n- ")
      .replace(/^/, "- ");
  }
  
  // Add a note about alternative ways to complete the task
  const alternative = cardType === "activity"
    ? "\n\n**Options:** You can write your answers OR tell your teacher your thoughts."
    : "";
    
  return `${intro}${simplifiedContent}${alternative}`;
}