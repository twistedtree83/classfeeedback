/**
 * Analyzes text content to identify potentially difficult vocabulary words
 * and provides student-friendly definitions
 */
export async function analyzeVocabulary(
  text: string,
  level: string = "",
  maxWords: number = 10
): Promise<Array<{ word: string; definition: string }>> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return defaultVocabularyAnalysis(text, level);
    }

    const prompt = `You are an expert educator who can identify vocabulary that might be challenging for students. 
    
Analyze the following text and identify up to ${maxWords} words or terms that might be difficult for students at the ${level || "general"} level. 
    
For each word, provide:
1. The exact word or term as it appears in the text
2. A concise, student-friendly definition (maximum 15 words)

Consider words that are:
- Technical or subject-specific terminology
- Abstract concepts
- Words with multiple meanings where context matters
- Complex vocabulary that's above the expected grade level

Text to analyze:
${text}

Format your response as a valid JSON array where each item has 'word' and 'definition' properties. 
Only include the JSON array in your response, nothing else.

Example:
[
  {"word": "photosynthesis", "definition": "Process plants use to make food using sunlight, water, and carbon dioxide"},
  {"word": "democracy", "definition": "System of government where people vote to elect representatives"}
]`;

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
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: "json_object" }, // Ensure a valid JSON response
      }),
    });

    if (!response.ok) {
      console.error("Error analyzing vocabulary with AI");
      return defaultVocabularyAnalysis(text, level);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return defaultVocabularyAnalysis(text, level);
    }

    try {
      const parsed = JSON.parse(result);
      
      // Validate the format of the response
      if (Array.isArray(parsed) && parsed.every(item => 
        typeof item === 'object' && 
        typeof item.word === 'string' && 
        typeof item.definition === 'string')) {
          return parsed;
      }
      
      // If we got JSON but not in the expected format
      return defaultVocabularyAnalysis(text, level);
    } catch (parseError) {
      console.error("Failed to parse AI vocabulary analysis:", parseError);
      return defaultVocabularyAnalysis(text, level);
    }
  } catch (error) {
    console.error("Error analyzing vocabulary:", error);
    return defaultVocabularyAnalysis(text, level);
  }
}

/**
 * Generates a simpler explanation of a vocabulary term for students
 * who need additional support
 */
export async function simplifyDefinition(
  word: string,
  currentDefinition: string,
  level: string = ""
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return generateFallbackSimplification(word, currentDefinition, level);
    }

    const prompt = `A student has indicated they need an even simpler explanation for the word "${word}".
    
Current definition: "${currentDefinition}"

Please create an extremely simplified definition that:
1. Uses only very basic vocabulary
2. Is appropriate for ${level || "young students"}
3. Includes a simple example if helpful
4. Is 1-2 sentences maximum
5. Explains the concept as if speaking to a much younger student

Your response should contain ONLY the simplified definition, nothing else.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Using a less expensive model for simple definitions
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 100, // Short response is sufficient
      }),
    });

    if (!response.ok) {
      console.error("Error generating simplified definition with AI");
      return generateFallbackSimplification(word, currentDefinition, level);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      return generateFallbackSimplification(word, currentDefinition, level);
    }

    return result;
  } catch (error) {
    console.error("Error simplifying definition:", error);
    return generateFallbackSimplification(word, currentDefinition, level);
  }
}

/**
 * Fallback function to generate basic vocabulary if AI analysis fails
 */
function defaultVocabularyAnalysis(
  text: string,
  level: string
): Array<{ word: string; definition: string }> {
  // Simple heuristic to extract potentially complex words
  const words = text.match(/\b[a-zA-Z]{7,}\b/g) || [];
  
  // Common complex words with definitions as fallback
  const commonComplexWords: Record<string, string> = {
    analysis: "Detailed examination of something",
    comprehensive: "Complete and thorough",
    development: "Process of growth or advancement",
    environment: "Surroundings or conditions",
    evaluate: "To judge or determine importance",
    hypothesis: "Proposed explanation requiring further investigation",
    implement: "Put into effect or action",
    perspective: "Particular way of viewing things",
    significant: "Important or notable",
    synthesize: "Combine different ideas or things",
  };
  
  // Create a set of unique words from the text
  const uniqueWords = new Set(words.map(word => word.toLowerCase()));
  
  // Collect words that match our common complex words list
  const result: Array<{ word: string; definition: string }> = [];
  
  uniqueWords.forEach(word => {
    if (commonComplexWords[word]) {
      result.push({
        word,
        definition: commonComplexWords[word]
      });
    }
  });
  
  // If we didn't find any matches in our common list, just take the first few long words
  if (result.length === 0) {
    words.slice(0, 5).forEach(word => {
      result.push({
        word,
        definition: `A ${level ? level.toLowerCase() + " level" : ""} term meaning: ${word}`
      });
    });
  }
  
  return result.slice(0, 10); // Return maximum 10 words
}

/**
 * Fallback function to generate a simplified definition if AI fails
 */
function generateFallbackSimplification(
  word: string,
  currentDefinition: string,
  level: string = ""
): string {
  // Just provide a simpler version by shortening and simplifying
  const simplifications: Record<string, string> = {
    "process": "way to do something",
    "analyze": "look at carefully",
    "complex": "not simple",
    "facilitate": "help make easier",
    "implement": "put into use",
    "comprehend": "understand",
    "significant": "important",
    "environment": "surroundings",
    "various": "different",
    "approximately": "about"
  };
  
  // Replace common complex words with simpler ones
  let simplified = currentDefinition;
  Object.entries(simplifications).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  });
  
  // Truncate to keep it shorter
  if (simplified.length > 60) {
    simplified = simplified.substring(0, 60).trim() + "...";
  }
  
  // Add a standard prefix
  return `${word} means ${simplified} in simple words.`;
}