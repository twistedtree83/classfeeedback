import React from 'react';
import { ParticipantsList } from '../ParticipantsList';
import { TeachingFeedbackPanel } from '../TeachingFeedbackPanel';

interface TeachingSidebarProps {
  showParticipants: boolean;
  showFeedback: boolean;
  sessionCode: string;
  presentationId: string;
}

export function TeachingSidebar({
  showParticipants,
  showFeedback,
  sessionCode,
  presentationId
}: TeachingSidebarProps) {
  return (
    <aside className="hidden lg:block w-96 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 space-y-6">
        {showFeedback && (
          <TeachingFeedbackPanel presentationId={presentationId} />
        )}

        {showParticipants && (
          <ParticipantsList sessionCode={sessionCode} />
        )}
      </div>
    </aside>
  );
}