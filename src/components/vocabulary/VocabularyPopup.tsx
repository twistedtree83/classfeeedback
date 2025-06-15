import React, { useRef, useEffect, useState } from 'react';
import { BookOpen, X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { simplifyDefinition } from '@/lib/ai/vocabularyAnalysis';

interface VocabularyPopupProps {
  word: string;
  definition: string;
  position: { x: number; y: number };
  onClose: () => void;
  level?: string;
}

export function VocabularyPopup({
  word,
  definition,
  position,
  onClose,
  level = ""
}: VocabularyPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifiedDefinition, setSimplifiedDefinition] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
  }, [position, isSimplified, simplifiedDefinition]);
  
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
  
  // Handle generating a simplified definition
  const handleSimplify = async () => {
    if (isGenerating) return;
    
    // If we already have a simplified definition, just toggle to it
    if (simplifiedDefinition) {
      setIsSimplified(true);
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const simplified = await simplifyDefinition(word, definition, level);
      setSimplifiedDefinition(simplified);
      setIsSimplified(true);
    } catch (error) {
      console.error("Error simplifying definition:", error);
      // Use the original definition if simplification fails
      setSimplifiedDefinition(`${word} in simpler terms: ${definition}`);
      setIsSimplified(true);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Toggle back to original definition
  const handleShowOriginal = () => {
    setIsSimplified(false);
  };
  
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
        {isSimplified ? simplifiedDefinition : definition}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
        {isSimplified ? (
          <Button 
            variant="outline"
            size="sm"
            onClick={handleShowOriginal}
            className="text-xs h-7"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Show Original
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimplify}
            disabled={isGenerating}
            className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 h-7"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Simplifying...
              </>
            ) : (
              <>
                I still don't understand
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}