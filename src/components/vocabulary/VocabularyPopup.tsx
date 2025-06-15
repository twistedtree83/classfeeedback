import React, { useRef, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';

interface VocabularyPopupProps {
  word: string;
  definition: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function VocabularyPopup({
  word,
  definition,
  position,
  onClose
}: VocabularyPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Adjust position to make sure popup stays within viewport
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Calculate adjusted position to keep popup in viewport
      let adjustedX = position.x;
      let adjustedY = position.y + 10;
      
      // Adjust horizontal position if needed
      if (position.x + rect.width > viewport.width - 20) {
        adjustedX = viewport.width - rect.width - 20;
      }
      
      // Adjust vertical position if needed
      if (position.y + rect.height > viewport.height - 20) {
        adjustedY = position.y - rect.height - 10;
      }
      
      // Apply adjusted position
      popupRef.current.style.left = `${adjustedX}px`;
      popupRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);
  
  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  return (
    <div 
      ref={popupRef}
      className="vocabulary-popup fixed z-50 bg-white rounded-lg shadow-xl border border-teal/20 p-4 max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <BookOpen className="h-4 w-4 text-teal mr-2" />
          <h3 className="font-bold text-teal">{word}</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="mt-2 text-sm text-gray-700">
        {definition}
      </div>
    </div>
  );
}