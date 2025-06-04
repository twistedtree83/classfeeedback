import React from 'react';
import { User, MessageSquare } from 'lucide-react';
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
        {avatarUrl ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={studentName} />
            <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <User size={20} className="text-indigo-600" />
        )}
        <span className="font-medium">{studentName}</span>
        <span className="ml-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
          {sessionCode}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMessagePanel}
          className="relative p-2 hover:bg-gray-100 rounded-full"
          aria-label="Toggle message panel"
        >
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          {newMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {newMessageCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}