import React from 'react';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface TeachingHeaderProps {
  sessionCode: string;
  lessonTitle?: string;
  hasNewQuestions: boolean;
  pendingCount: number;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onOpenMessageModal: () => void;
  onEndSession: () => void;
}

export function TeachingHeader({
  sessionCode,
  lessonTitle,
  hasNewQuestions,
  pendingCount,
  showSidebar,
  onToggleSidebar,
  onOpenMessageModal,
  onEndSession
}: TeachingHeaderProps) {
  return (
    <div className="bg-antique shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center w-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-blue hover:bg-sage/10"
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Center the lesson title */}
          <div className="flex-1 flex justify-center items-center">
            <h1 className="text-xl font-semibold text-slate-blue truncate px-2 max-w-2xl">
              {lessonTitle || 'Lesson Presentation'}
            </h1>
            <div className="ml-2 bg-terracotta/10 text-terracotta px-3 py-1 rounded-md font-mono">
              {sessionCode}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-10">
            <Button
              variant="outline"
              onClick={onOpenMessageModal}
              size="sm"
              className="ml-auto border-terracotta text-terracotta hover:bg-terracotta/10"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}