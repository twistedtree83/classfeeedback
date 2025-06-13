import React from "react";

interface GameMessageProps {
  message: string;
  show: boolean;
}

export function GameMessage({ message, show }: GameMessageProps) {
  if (!show) return null;

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
        {message}
      </div>
    </div>
  );
}
