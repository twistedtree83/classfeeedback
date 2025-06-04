import React from 'react';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { sanitizeHtml } from '../../lib/utils';
import type { LessonCard } from '../../lib/types';

interface TeachingContentAreaProps {
  currentCard: LessonCard | null;
  displayedCardIndex: number;
  totalCards: number;
  progressPercentage: number;
  isFirstCard: boolean;
  isLastCard: boolean;
  onPrevious: () => void;
  onNext: () => void;
  sessionCode: string;
}

export function TeachingContentArea({
  currentCard,
  displayedCardIndex,
  totalCards,
  progressPercentage,
  isFirstCard,
  isLastCard,
  onPrevious,
  onNext,
  sessionCode
}: TeachingContentAreaProps) {
  if (!currentCard) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-coral/10 text-coral p-4 rounded-lg">
          Card content not available
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-teal h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Card container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6 border border-teal/20">
        {/* Card header */}
        <div className="bg-teal/10 p-6 border-b border-teal/20">
          <h2 className="text-2xl font-bold text-teal">
            {currentCard.title}
          </h2>
          {currentCard.duration && (
            <p className="text-coral mt-1">{currentCard.duration}</p>
          )}
          <div className="text-sm text-teal/70 mt-2">
            Card {displayedCardIndex + 1} of {totalCards}
          </div>
        </div>

        {/* Card content */}
        <div className="p-6">
          {typeof currentCard.content === 'string' ? (
            <div 
              className="prose max-w-none text-gray-800" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentCard.content) }}
            ></div>
          ) : (
            <div className="prose max-w-none text-gray-800">
              {(currentCard.content as string[]).map((line, i) => (
                <p key={i} className="mb-4 leading-relaxed">{line || '\u00A0'}</p>
              ))}
            </div>
          )}
        </div>

        {/* Card navigation */}
        <div className="border-t border-teal/20 bg-teal/5 p-4 flex justify-between items-center">
          <Button
            onClick={onPrevious}
            disabled={isFirstCard}
            variant="outline"
            className="border-teal text-teal hover:bg-teal/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          <span className="text-teal/70">
            {displayedCardIndex + 1} / {totalCards}
          </span>
          {isFirstCard ? (
            <Button
              onClick={onNext}
              className="bg-coral hover:bg-coral/90 text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              <Play className="h-5 w-5 mr-2" />
              Ready to Go
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={isLastCard}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Student join instructions */}
      <div className="bg-orange/10 border border-orange/30 rounded-lg p-4 text-gray-800">
        <h3 className="font-bold mb-2 text-teal">Student Join Instructions</h3>
        <p>
          Students can join this session by visiting{' '}
          <span className="font-medium">/student?code={sessionCode}</span>{' '}
          or by entering the code: <strong className="text-coral">{sessionCode}</strong>
        </p>
      </div>
    </div>
  );
}