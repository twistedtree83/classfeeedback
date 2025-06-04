import React from 'react';
import { ArrowLeft, ArrowRight, Play, Paperclip, UserCheck, UserX } from 'lucide-react';
import { Button } from '../ui/Button';
import { sanitizeHtml } from '../../lib/utils';
import type { LessonCard, SessionParticipant } from '../../lib/types';
import { AttachmentDisplay } from '../AttachmentDisplay';

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
  pendingParticipants?: SessionParticipant[];
  onApproveParticipant?: (participantId: string) => void;
  onRejectParticipant?: (participantId: string) => void;
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
  sessionCode,
  pendingParticipants = [],
  onApproveParticipant,
  onRejectParticipant
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

          {/* Attachments section */}
          {currentCard.attachments && currentCard.attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-base font-medium text-gray-700 flex items-center mb-3">
                <Paperclip className="h-5 w-5 mr-2 text-teal" />
                Attachments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCard.attachments.map(attachment => (
                  <AttachmentDisplay 
                    key={attachment.id} 
                    attachment={attachment} 
                  />
                ))}
              </div>
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

      {/* Pending students approval section */}
      {pendingParticipants.length > 0 && (
        <div className="bg-orange/10 border border-orange/30 rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-orange/20 flex justify-between items-center">
            <h3 className="font-semibold text-orange flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Students Waiting for Approval ({pendingParticipants.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="grid gap-2">
              {pendingParticipants.slice(0, 5).map(participant => (
                <div key={participant.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-orange/20">
                  <div className="font-medium">{participant.student_name}</div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onApproveParticipant?.(participant.id)}
                      size="sm"
                      className="bg-teal hover:bg-teal/90 text-white"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => onRejectParticipant?.(participant.id)}
                      size="sm"
                      variant="outline"
                      className="border-red text-red hover:bg-red/10"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              
              {pendingParticipants.length > 5 && (
                <div className="text-center p-2 text-orange">
                  + {pendingParticipants.length - 5} more students waiting
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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