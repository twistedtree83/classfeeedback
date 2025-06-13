import { useState, useCallback, useEffect } from "react";
import {
  checkGuess,
  getKeyboardState,
  type TileState,
  type GameStatus,
} from "../utils/gameUtils";

export interface WordleState {
  guesses: string[];
  currentGuess: string;
  currentRow: number;
  gameStatus: GameStatus;
  target: string;
  keyboardState: Map<string, TileState>;
  message: string;
  showMessage: boolean;
  isValidating: boolean;
}

// Basic word validation for 5-letter words
const isValidWord = async (word: string): Promise<boolean> => {
  // For this implementation, we'll accept any 5-letter alphabetic word
  // In a real implementation, you might want to check against a dictionary
  return word.length === 5 && /^[A-Za-z]+$/.test(word);
};

// Get a random 5-letter word as fallback
const getRandomWord = (): string => {
  const words = [
    "LEARN",
    "TEACH",
    "STUDY",
    "THINK",
    "BRAIN",
    "SMART",
    "POWER",
    "SKILL",
    "FOCUS",
    "SOLVE",
    "LOGIC",
    "IDEAS",
    "FACTS",
    "TRUTH",
    "WRITE",
    "SPEAK",
    "SOUND",
    "VOICE",
    "WORDS",
    "NOTES",
    "BOOKS",
  ];
  return words[Math.floor(Math.random() * words.length)];
};

export function useWordle(targetWord?: string) {
  const [state, setState] = useState<WordleState>(() => ({
    guesses: [],
    currentGuess: "",
    currentRow: 0,
    gameStatus: "playing",
    target: targetWord?.toUpperCase() || getRandomWord(),
    keyboardState: new Map(),
    message: "",
    showMessage: false,
    isValidating: false,
  }));

  const showMessage = useCallback((message: string) => {
    setState((prev) => ({ ...prev, message, showMessage: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, showMessage: false }));
    }, 2000);
  }, []);

  const resetGame = useCallback(() => {
    setState((prev) => ({
      guesses: [],
      currentGuess: "",
      currentRow: 0,
      gameStatus: "playing",
      target: prev.target, // Keep the same target word for educational games
      keyboardState: new Map(),
      message: "",
      showMessage: false,
      isValidating: false,
    }));
  }, []);

  const addLetter = useCallback(
    (letter: string) => {
      if (
        state.gameStatus !== "playing" ||
        state.currentGuess.length >= 5 ||
        state.isValidating
      )
        return;

      setState((prev) => ({
        ...prev,
        currentGuess: prev.currentGuess + letter.toUpperCase(),
      }));
    },
    [state.gameStatus, state.currentGuess.length, state.isValidating]
  );

  const removeLetter = useCallback(() => {
    if (
      state.gameStatus !== "playing" ||
      state.currentGuess.length === 0 ||
      state.isValidating
    )
      return;

    setState((prev) => ({
      ...prev,
      currentGuess: prev.currentGuess.slice(0, -1),
    }));
  }, [state.gameStatus, state.currentGuess.length, state.isValidating]);

  const submitGuess = useCallback(async () => {
    if (
      state.gameStatus !== "playing" ||
      state.currentGuess.length !== 5 ||
      state.isValidating
    ) {
      if (state.currentGuess.length !== 5) {
        showMessage("Not enough letters");
      }
      return;
    }

    // Set validating state
    setState((prev) => ({ ...prev, isValidating: true }));

    try {
      const isValid = await isValidWord(state.currentGuess);

      if (!isValid) {
        showMessage("Not in word list");
        setState((prev) => ({ ...prev, isValidating: false }));
        return;
      }

      const newGuesses = [...state.guesses, state.currentGuess];
      const newKeyboardState = getKeyboardState(newGuesses, state.target);

      let newGameStatus: GameStatus = "playing";
      let message = "";

      if (state.currentGuess === state.target) {
        newGameStatus = "won";
        const messages = [
          "Genius!",
          "Magnificent!",
          "Impressive!",
          "Splendid!",
          "Great!",
          "Phew!",
        ];
        message = messages[state.currentRow] || "Great!";
      } else if (newGuesses.length >= 6) {
        newGameStatus = "lost";
        message = state.target;
      }

      setState((prev) => ({
        ...prev,
        guesses: newGuesses,
        currentGuess: "",
        currentRow: prev.currentRow + 1,
        gameStatus: newGameStatus,
        keyboardState: newKeyboardState,
        message,
        showMessage: newGameStatus !== "playing",
        isValidating: false,
      }));
    } catch (error) {
      console.error("Error validating word:", error);
      showMessage("Validation error, try again");
      setState((prev) => ({ ...prev, isValidating: false }));
    }
  }, [state, showMessage]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (state.gameStatus !== "playing" || state.isValidating) return;

      if (event.key === "Enter") {
        submitGuess();
      } else if (event.key === "Backspace") {
        removeLetter();
      } else if (/^[A-Za-z]$/.test(event.key)) {
        addLetter(event.key);
      }
    },
    [state.gameStatus, state.isValidating, submitGuess, removeLetter, addLetter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Update target word if prop changes
  useEffect(() => {
    if (targetWord && targetWord.toUpperCase() !== state.target) {
      setState((prev) => ({
        ...prev,
        target: targetWord.toUpperCase(),
        guesses: [],
        currentGuess: "",
        currentRow: 0,
        gameStatus: "playing",
        keyboardState: new Map(),
        message: "",
        showMessage: false,
        isValidating: false,
      }));
    }
  }, [targetWord, state.target]);

  return {
    ...state,
    addLetter,
    removeLetter,
    submitGuess,
    resetGame,
  };
}
