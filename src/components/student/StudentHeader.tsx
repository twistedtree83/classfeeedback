import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StudentHeaderProps {
  studentName: string;
  sessionCode: string;
  avatarUrl?: string | null;
  newMessageCount: number;
  onToggleMessagePanel: () => void;
}

export function StudentHeader({
  studentName,
  sessionCode,
  avatarUrl,
  newMessageCount,
  onToggleMessagePanel
}: StudentHeaderProps) {
  return (
    <div className="max-w-4xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl || undefined} alt={studentName} />
          <AvatarFallback className="bg-teal/20 text-teal">{studentName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{studentName}</span>
        <span className="ml-1 bg-teal/10 text-teal px-2 py-1 rounded text-xs">
          {sessionCode}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMessagePanel}
          className="relative p-2 hover:bg-teal/10 rounded-full border border-teal/20"
          aria-label="Toggle message panel"
        >
          <MessageSquare className="h-5 w-5 text-teal" />
          {newMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-coral text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {newMessageCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}