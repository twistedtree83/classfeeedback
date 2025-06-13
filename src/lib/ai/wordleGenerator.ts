// AI-powered word generation for Wordle based on lesson content

interface WordleWordRequest {
  lessonTitle: string;
  lessonObjectives?: string[];
  lessonContent?: string;
  difficulty?: "elementary" | "middle" | "high";
}

export async function generateWordleWord(
  request: WordleWordRequest
): Promise<string> {
  const {
    lessonTitle,
    lessonObjectives,
    lessonContent,
    difficulty = "middle",
  } = request;

  const prompt = `Generate a single word for Wordle that is EXACTLY 5 letters long and related to this lesson:

Lesson Title: ${lessonTitle}
${lessonObjectives ? `Objectives: ${lessonObjectives.join(", ")}` : ""}
${lessonContent ? `Content: ${lessonContent.substring(0, 500)}...` : ""}
Difficulty Level: ${difficulty} school

CRITICAL REQUIREMENTS:
- Must be EXACTLY 5 letters (no more, no less)
- Must be a real English word
- Must be related to the lesson topic
- Must be appropriate for ${difficulty} school students

VALID 5-letter examples by subject:
- Science: ATOMS, CELLS, PLANT, LIGHT, FORCE, SOLID, GASES, METAL
- Math: ANGLE, GRAPH, EQUAL, RATIO, SOLVE, PRIME, TERMS, LINES  
- History: EPOCH, CIVIL, TRADE, CROWN, PEACE, WORLD, TIMES, DATES
- English: WORDS, STORY, DRAMA, PROSE, VERSE, THEME, WRITE, STYLE

COUNT THE LETTERS: Your response must have exactly 5 letters.
Respond with ONLY the 5-letter word in ALL CAPS, nothing else.`;

  try {
    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.warn("OpenAI API key is missing, using fallback word");
      return getFallbackWord(lessonTitle);
    }

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
            content:
              "You are a helpful assistant that generates educational word puzzles.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return getFallbackWord(lessonTitle);
    }

    const data = await response.json();
    const word = data.choices?.[0]?.message?.content?.trim().toUpperCase();

    // Validate the response - accept 5-letter words only for traditional Wordle
    if (!word || word.length !== 5 || !/^[A-Z]+$/.test(word)) {
      console.warn("AI generated invalid word:", word, "Using fallback");
      return getFallbackWord(lessonTitle);
    }

    return word;
  } catch (error) {
    console.error("Error generating Wordle word:", error);
    return getFallbackWord(lessonTitle);
  }
}

function getFallbackWord(lessonTitle: string): string {
  // Map common lesson topics to appropriate 5-letter words
  const topicMap: Record<string, string[]> = {
    // Science
    science: [
      "ATOMS",
      "CELLS",
      "PLANT",
      "LIGHT",
      "FORCE",
      "EARTH",
      "SPACE",
      "GENES",
      "GROWS",
      "WATER",
    ],
    biology: [
      "CELLS",
      "PLANT",
      "GENES",
      "BLOOD",
      "BRAIN",
      "HEART",
      "BONES",
      "GROWS",
    ],
    chemistry: ["ATOMS", "BONDS", "ACIDS", "BASES", "METAL", "GASES", "SOLID"],
    physics: ["FORCE", "LIGHT", "SOUND", "WAVES", "POWER", "SPEED", "SPACE"],

    // Math
    math: ["ANGLE", "GRAPH", "EQUAL", "RATIO", "SOLVE", "PRIME", "LOGIC"],
    algebra: ["SOLVE", "EQUAL", "GRAPH", "SLOPE", "TERMS", "POWER"],
    geometry: ["ANGLE", "SHAPE", "LINES", "CURVE", "POINT", "PLANE"],

    // English
    english: ["WORDS", "STORY", "POEMS", "DRAMA", "PROSE", "VERSE", "THEME"],
    literature: ["STORY", "NOVEL", "DRAMA", "PROSE", "VERSE", "THEME", "PLOTS"],
    writing: ["WORDS", "WRITE", "DRAFT", "EDITS", "STYLE", "VOICE"],

    // History
    history: ["EPOCH", "TRADE", "PEACE", "CROWN", "CIVIL", "WORLD", "TIMES"],

    // General education
    learn: ["LEARN", "STUDY", "THINK", "BRAIN", "SMART", "SKILL", "FOCUS"],
    teach: ["TEACH", "LEARN", "STUDY", "SKILL", "FACTS", "IDEAS", "NOTES"],
    growth: ["GROWS", "LEARN", "STUDY", "GAINS", "BOOST", "BUILD"],
  };

  // Find matching topic
  const title = lessonTitle.toLowerCase();
  for (const [topic, words] of Object.entries(topicMap)) {
    if (title.includes(topic)) {
      return words[Math.floor(Math.random() * words.length)];
    }
  }

  // Default educational words
  const defaultWords = [
    "LEARN",
    "STUDY",
    "THINK",
    "SMART",
    "SKILL",
    "FOCUS",
    "IDEAS",
    "GROWS",
  ];
  return defaultWords[Math.floor(Math.random() * defaultWords.length)];
}
