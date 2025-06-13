import React from "react";
import { TileState } from "../../utils/gameUtils";

interface GameTileProps {
  letter: string;
  state: TileState;
  delay?: number;
}

const tileStyles: Record<TileState, string> = {
  empty: "border-2 border-gray-300 bg-white",
  filled: "border-2 border-gray-400 bg-white text-gray-800",
  correct: "border-2 border-green-600 bg-green-600 text-white",
  present: "border-2 border-yellow-500 bg-yellow-500 text-white",
  absent: "border-2 border-gray-500 bg-gray-500 text-white",
};

export function GameTile({ letter, state, delay = 0 }: GameTileProps) {
  return (
    <div
      className={`
        w-14 h-14 flex items-center justify-center
        font-bold text-xl uppercase transition-all duration-500
        ${tileStyles[state]}
        ${state !== "empty" && state !== "filled" ? "animate-flip" : ""}
      `}
      style={{
        animationDelay: `${delay}ms`,
      }}
      role="gridcell"
      aria-label={letter ? `Letter ${letter}` : "Empty cell"}
    >
      {letter}
    </div>
  );
}
