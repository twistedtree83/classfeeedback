export async function generateDifferentiatedContent(
  content: string,
  cardType: string,
  level: string = ""
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return defaultDifferentiatedContent(content, cardType);
    }

    const prompt = `Create a differentiated version of this ${cardType} content that provides multiple learning pathways and accommodates different learning styles and abilities. The content should be inclusive and accessible for ${
      level || "diverse learners"
    }.

Original content:
${content}

Create differentiated content that includes:
- Clear, scaffolded instructions for different ability levels
- Multiple ways to engage with the material (visual, auditory, kinesthetic)
- Options for different learning preferences
- Support for struggling learners and challenges for advanced learners
- Clear structure and organization

Make it comprehensive but accessible, maintaining the core learning goals while providing multiple pathways to success.

Return only the differentiated content, no additional explanations.`;

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
      console.error("Error generating differentiated content from AI");
      return defaultDifferentiatedContent(content, cardType);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return defaultDifferentiatedContent(content, cardType);
    }

    return result.trim();
  } catch (error) {
    console.error("Error generating differentiated content:", error);
    return defaultDifferentiatedContent(content, cardType);
  }
}

function defaultDifferentiatedContent(
  content: string,
  cardType: string
): string {
  // Create basic differentiated version
  let differentiated = `**Multiple Learning Pathways:**\n\n`;

  differentiated += `**🎯 Core Content:**\n${content}\n\n`;

  differentiated += `**📚 For Different Learning Styles:**\n`;
  differentiated += `• **Visual Learners:** Use diagrams, charts, or mind maps\n`;
  differentiated += `• **Auditory Learners:** Discuss concepts aloud or use audio resources\n`;
  differentiated += `• **Kinesthetic Learners:** Engage with hands-on activities\n\n`;

  differentiated += `**📈 Differentiated Support:**\n`;
  differentiated += `• **Additional Support:** Break down into smaller steps, provide examples\n`;
  differentiated += `• **Extension Challenge:** Apply concepts to new situations or create something original\n`;

  return differentiated;
}
