import React from 'react';
import { Wand } from 'lucide-react';

interface ActivityExpandButtonProps {
  onClick: () => void;
  className?: string;
}

export function ActivityExpandButton({ onClick, className }: ActivityExpandButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors ${className || ''}`}
      title="Expand activity with AI"
    >
      <Wand className="h-3.5 w-3.5 mr-1" />
      <span>Expand Activity</span>
    </button>
  );
}