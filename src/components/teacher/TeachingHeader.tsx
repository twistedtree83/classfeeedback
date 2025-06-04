import React from 'react';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface TeachingHeaderProps {
  sessionCode: string;
  hasNewQuestions: boolean;
  pendingCount: number;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onOpenMessageModal: () => void;
  onEndSession: () => void;
}

export function TeachingHeader({
  sessionCode,
  hasNewQuestions,
  pendingCount,
  showSidebar,
  onToggleSidebar,
  onOpenMessageModal,
  onEndSession
}: TeachingHeaderProps) {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="mr-2"
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Teaching Mode
            </h1>
            <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md font-mono ml-4">
              {sessionCode}
            </div>
          </div>
          <div className="flex items-center space-x-2">
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