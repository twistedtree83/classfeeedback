import React from 'react';
import { Users, BarChart3, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface TeachingHeaderProps {
  sessionCode: string;
  hasNewQuestions: boolean;
  pendingCount: number;
  showFeedback: boolean;
  showParticipants: boolean;
  onToggleFeedback: () => void;
  onToggleParticipants: () => void;
  onOpenMessageModal: () => void;
  onEndSession: () => void;
}

export function TeachingHeader({
  sessionCode,
  hasNewQuestions,
  pendingCount,
  showFeedback,
  showParticipants,
  onToggleFeedback,
  onToggleParticipants,
  onOpenMessageModal,
  onEndSession
}: TeachingHeaderProps) {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Teaching Mode
            </h1>
            <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md font-mono ml-4">
              {sessionCode}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={showFeedback ? "primary" : "outline"}
              onClick={onToggleFeedback}
              size="sm"
              className="relative"
            >
              <BarChart3 className="h-5 w-5" />
              {hasNewQuestions && !showFeedback && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
            <Button
              variant={showParticipants ? "primary" : "outline"}
              onClick={onToggleParticipants}
              size="sm"
              className="relative"
            >
              <Users className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onOpenMessageModal}
              size="sm"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={onEndSession}
            >
              End Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}