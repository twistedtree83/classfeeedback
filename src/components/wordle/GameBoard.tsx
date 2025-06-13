import React from "react";
import { GameTile } from "./GameTile";
import { checkGuess, type TileState } from "../../utils/gameUtils";

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  currentRow: number;
  target: string;
}

export function GameBoard({
  guesses,
  currentGuess,
  currentRow,
  target,
}: GameBoardProps) {
  const rows = Array.from({ length: 6 }, (_, rowIndex) => {
    if (rowIndex < guesses.length) {
      // Completed guess
      const guess = guesses[rowIndex];
      const states = checkGuess(guess, target);
      return guess.split("").map((letter, colIndex) => ({
        letter,
        state: states[colIndex],
        key: `${rowIndex}-${colIndex}`,
        delay: colIndex * 100, // Stagger the flip animation
      }));
    } else if (rowIndex === currentRow && currentGuess) {
      // Current guess being typed
      const letters = currentGuess.split("");
      return Array.from({ length: 5 }, (_, colIndex) => ({
        letter: letters[colIndex] || "",
        state: letters[colIndex]
          ? ("filled" as TileState)
          : ("empty" as TileState),
        key: `${rowIndex}-${colIndex}`,
        delay: 0,
      }));
    } else {
      // Empty row
      return Array.from({ length: 5 }, (_, colIndex) => ({
        letter: "",
        state: "empty" as TileState,
        key: `${rowIndex}-${colIndex}`,
        delay: 0,
      }));
    }
  });

  return (
    <div
      className="grid grid-rows-6 gap-2 p-4"
      role="grid"
      aria-label="Wordle game board"
    >
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-2" role="row">
          {row.map((tile) => (
            <GameTile
              key={tile.key}
              letter={tile.letter}
              state={tile.state}
              delay={tile.delay}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
