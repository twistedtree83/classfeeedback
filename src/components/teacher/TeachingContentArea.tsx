import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
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
          className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Card container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6 border border-indigo-100">
        {/* Card header */}
        <div className="bg-indigo-50 p-6 border-b border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentCard.title}
          </h2>
          {currentCard.duration && (
            <p className="text-gray-500 mt-1">{currentCard.duration}</p>
          )}
          <div className="text-sm text-gray-500 mt-2">
            Card {displayedCardIndex + 1} of {totalCards}
          </div>
        </div>

        {/* Card content */}
        <div className="p-6">
          {typeof currentCard.content === 'string' ? (
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentCard.content) }}
            ></div>
          ) : (
            <div className="prose max-w-none">
              {(currentCard.content as string[]).map((line, i) => (
                <p key={i} className="mb-4 leading-relaxed">{line || '\u00A0'}</p>
              ))}
            </div>
          )}
        </div>

        {/* Card navigation */}
        <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-between items-center">
          <Button
            onClick={onPrevious}
            disabled={isFirstCard}
            variant="outline"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          <span className="text-gray-500">
            {displayedCardIndex + 1} / {totalCards}
          </span>
          <Button
            onClick={onNext}
            disabled={isLastCard}
          >
            Next
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Student join instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
        <h3 className="font-bold mb-2">Student Join Instructions</h3>
        <p>
          Students can join this session by visiting{' '}
          <span className="font-medium">/student?code={sessionCode}</span>{' '}
          or by entering the code: <strong>{sessionCode}</strong>
        </p>
      </div>
    </div>
  );
}