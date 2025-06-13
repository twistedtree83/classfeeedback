export type TileState = "empty" | "filled" | "correct" | "present" | "absent";
export type GameStatus = "playing" | "won" | "lost";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}

export function checkGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = new Array(5).fill("absent");
  const targetLetters = target.split("");
  const guessLetters = guess.split("");

  // First pass: mark correct positions
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = "correct";
      targetLetters[i] = "*"; // Mark as used
      guessLetters[i] = "*"; // Mark as used
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] !== "*") {
      const targetIndex = targetLetters.indexOf(guessLetters[i]);
      if (targetIndex !== -1) {
        result[i] = "present";
        targetLetters[targetIndex] = "*"; // Mark as used
      }
    }
  }

  return result;
}

export function getKeyboardState(
  guesses: string[],
  target: string
): Map<string, TileState> {
  const keyboardState = new Map<string, TileState>();

  guesses.forEach((guess) => {
    const states = checkGuess(guess, target);
    guess.split("").forEach((letter, index) => {
      const currentState = keyboardState.get(letter);
      const newState = states[index];

      // Priority: correct > present > absent
      if (
        !currentState ||
        newState === "correct" ||
        (newState === "present" && currentState === "absent")
      ) {
        keyboardState.set(letter, newState);
      }
    });
  });

  return keyboardState;
}

export function getGameStats(): GameStats {
  const stats = localStorage.getItem("wordle-stats");
  return stats
    ? JSON.parse(stats)
    : {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0],
      };
}

export function updateGameStats(won: boolean, guessCount: number): GameStats {
  const stats = getGameStats();

  stats.gamesPlayed++;

  if (won) {
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[guessCount - 1]++;
  } else {
    stats.currentStreak = 0;
  }

  localStorage.setItem("wordle-stats", JSON.stringify(stats));
  return stats;
}
