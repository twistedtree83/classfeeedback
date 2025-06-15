import React from 'react';
import { MessageSquare, Menu, X, Bell } from 'lucide-react';
import { Button } from '../ui/Button';

interface TeachingHeaderProps {
  sessionCode: string;
  lessonTitle?: string;
  hasNewQuestions: boolean;
  hasNewExtensionRequests?: boolean; // Add this prop
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
  hasNewExtensionRequests = false, // Default to false
  pendingCount,
  showSidebar,
  onToggleSidebar,
  onOpenMessageModal,
  onEndSession
}: TeachingHeaderProps) {
  // Determine if there are any new notifications
  const hasNotifications = hasNewQuestions || hasNewExtensionRequests || pendingCount > 0;

  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center w-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className={`p-1.5 ${hasNotifications ? "text-red" : "text-teal"} hover:bg-teal/10 relative`}
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              
              {/* Notification indicator */}
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 bg-red text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {pendingCount || "!"}
                </span>
              )}
            </Button>
          </div>
          
          {/* Center the lesson title */}
          <div className="flex-1 flex justify-center items-center">
            <h1 className="text-xl font-semibold text-teal truncate px-2 max-w-2xl">
              {lessonTitle || 'Lesson Presentation'}
            </h1>
            <div className="ml-2 bg-orange/10 text-orange px-3 py-1 rounded-md font-mono">
              {sessionCode}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-10">
            <Button
              variant="outline"
              onClick={onOpenMessageModal}
              size="sm"
              className="ml-auto border-coral text-coral hover:bg-coral/10"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}