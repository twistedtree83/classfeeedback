import React from "react";
import { TileState } from "../../utils/gameUtils";

interface KeyboardProps {
  keyboardState: Map<string, TileState>;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
  isValidating?: boolean;
}

const keyboardLayout = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const keyStyles: Record<TileState | "default", string> = {
  default: "bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300",
  empty: "bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300",
  filled: "bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300",
  correct: "bg-green-600 hover:bg-green-700 text-white border-green-600",
  present: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500",
  absent: "bg-gray-500 hover:bg-gray-600 text-white border-gray-500",
};

export function Keyboard({
  keyboardState,
  onKeyPress,
  onBackspace,
  onEnter,
  disabled = false,
  isValidating = false,
}: KeyboardProps) {
  const getKeyStyle = (key: string): string => {
    const state = keyboardState.get(key);
    return keyStyles[state || "default"];
  };

  const handleKeyClick = (key: string) => {
    if (disabled || isValidating) return;

    if (key === "ENTER") {
      onEnter();
    } else if (key === "BACKSPACE") {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  const isButtonDisabled = disabled || isValidating;

  return (
    <div
      className="w-full max-w-lg mx-auto px-2 pb-4"
      role="application"
      aria-label="Virtual keyboard"
    >
      {keyboardLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 mb-2">
          {rowIndex === 1 && <div className="w-4 sm:w-5" />}
          {row.map((key) => {
            const isSpecial = key === "ENTER" || key === "BACKSPACE";
            const isEnter = key === "ENTER";
            return (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                disabled={isButtonDisabled}
                className={`
                  ${
                    isSpecial
                      ? "px-2 sm:px-3 text-xs sm:text-sm min-w-[60px] sm:min-w-[70px]"
                      : "w-8 sm:w-10 text-sm sm:text-base"
                  } 
                  h-12 sm:h-14 flex items-center justify-center
                  font-bold uppercase
                  rounded-lg border-2 transition-all duration-200 transform
                  ${getKeyStyle(key)}
                  ${
                    !isButtonDisabled
                      ? "hover:-translate-y-0.5 active:scale-95"
                      : ""
                  }
                  focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2
                  ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  ${isEnter && isValidating ? "animate-pulse" : ""}
                `}
                aria-label={
                  key === "BACKSPACE"
                    ? "Delete"
                    : key === "ENTER"
                    ? isValidating
                      ? "Validating..."
                      : "Submit guess"
                    : `Letter ${key}`
                }
              >
                {key === "BACKSPACE"
                  ? "⌫"
                  : key === "ENTER" && isValidating
                  ? "..."
                  : key}
              </button>
            );
          })}
          {rowIndex === 1 && <div className="w-4 sm:w-5" />}
        </div>
      ))}
      {isValidating && (
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">Checking word...</p>
        </div>
      )}
    </div>
  );
}
