import React, { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { GameBoard } from "./GameBoard";
import { Keyboard } from "./Keyboard";
import { GameMessage } from "./GameMessage";
import { useWordle } from "../../hooks/useWordle";

interface WordleGameProps {
  isOpen: boolean;
  onClose: () => void;
  targetWord?: string;
  lessonTitle?: string;
}

export function WordleGame({
  isOpen,
  onClose,
  targetWord,
  lessonTitle,
}: WordleGameProps) {
  const wordle = useWordle(targetWord);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal to-coral p-4 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-bold">Brains On Wordle</h2>
              {lessonTitle && (
                <p className="text-white/80 text-sm mt-1">{lessonTitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm">
              Guess the lesson-related word in 6 tries!
            </p>
          </div>

          {/* Game Message */}
          <GameMessage message={wordle.message} show={wordle.showMessage} />

          {/* Game Board */}
          <div className="flex justify-center mb-6">
            <GameBoard
              guesses={wordle.guesses}
              currentGuess={wordle.currentGuess}
              currentRow={wordle.currentRow}
              target={wordle.target}
            />
          </div>

          {/* Keyboard */}
          <Keyboard
            keyboardState={wordle.keyboardState}
            onKeyPress={wordle.addLetter}
            onBackspace={wordle.removeLetter}
            onEnter={wordle.submitGuess}
            disabled={wordle.gameStatus !== "playing"}
            isValidating={wordle.isValidating}
          />

          {/* Game Result */}
          {wordle.gameStatus !== "playing" && (
            <div className="mt-6 text-center">
              <div
                className={`p-4 rounded-lg ${
                  wordle.gameStatus === "won"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {wordle.gameStatus === "won" ? (
                  <div>
                    <h3 className="font-bold text-lg mb-2">
                      🎉 Congratulations!
                    </h3>
                    <p>
                      You guessed the word in {wordle.guesses.length} tries!
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-lg mb-2">Game Over!</h3>
                    <p>
                      The word was:{" "}
                      <strong className="uppercase">{wordle.target}</strong>
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={wordle.resetGame}
                className="mt-4 px-6 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
