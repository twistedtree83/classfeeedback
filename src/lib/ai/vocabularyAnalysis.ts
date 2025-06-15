/**
 * Analyzes text content to identify potentially difficult vocabulary words
 * and provides student-friendly definitions
 */
export async function analyzeVocabulary(
  text: string,
  level: string = "",
  maxWords: number = 25
): Promise<Array<{ word: string; definition: string }>> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return defaultVocabularyAnalysis(text, level);
    }

    const prompt = `You are an expert educator who can identify vocabulary that might be challenging for students. 
    
Analyze the following text and identify up to ${maxWords} words or terms that might be difficult for students at the ${level || "middle school"} level. 
    
For each word, provide:
1. The exact word or term as it appears in the text
2. A concise, student-friendly definition (maximum 15 words)

BE GENEROUS in identifying challenging words - err on the side of including more words rather than fewer. For middle school students (Year 7-9), include terms like:
- Subject-specific terminology
- Abstract concepts
- Words with multiple meanings
- Words that exceed basic vocabulary
- Words longer than 8 letters
- Academic language
- Domain-specific vocabulary

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
  // Improved heuristic to extract potentially complex words
  // Now captures words 7+ characters and additional common complex terms
  const words = text.match(/\b[a-zA-Z]{7,}\b/g) || [];
  
  // Common complex words with definitions - expanded list
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
    urbanization: "Growth of cities as people move from rural to urban areas",
    sustainability: "Ability to maintain something at a certain level over time",
    infrastructure: "Basic physical structures needed for society to operate",
    economic: "Related to the production, distribution, and use of money and goods",
    population: "All the people living in a particular area",
    environmental: "Related to the natural world and human impact on it",
    transportation: "Systems for moving people or goods from place to place",
    complexities: "State of being complicated or having many interconnected parts",
    critically: "In a way that involves careful evaluation and judgment",
    megacities: "Very large cities with populations over 10 million people",
  };
  
  // Extract all words from text
  const allWords = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
  
  // Create a set of unique words from the text
  const uniqueWords = new Set(allWords.map(word => word.toLowerCase()));
  
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
  
  // If we found fewer than 10 matches, add longer words (7+ characters)
  if (result.length < 10) {
    const longWords = new Set(words.map(w => w.toLowerCase()));
    longWords.forEach(word => {
      if (!commonComplexWords[word] && result.length < maxWords) {
        result.push({
          word,
          definition: `A ${level ? level.toLowerCase() + " level" : ""} term meaning: a form of ${word}`
        });
      }
    });
  }
  
  return result.slice(0, maxWords); // Return up to maxWords words
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
    "approximately": "about",
    "urbanization": "when more people move to cities",
    "sustainability": "keeping something going for a long time",
    "megacities": "super big cities with lots of people",
    "infrastructure": "roads, bridges and buildings we all use",
    "critically": "thinking really carefully",
    "complexities": "tricky parts that are hard to understand"
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