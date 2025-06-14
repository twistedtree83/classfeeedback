import React from 'react';
import { Button } from '@/components/ui/Button';
import { Wand } from 'lucide-react';

interface ActivityExpandButtonProps {
  onClick: () => void;
  className?: string;
}

export function ActivityExpandButton({ onClick, className }: ActivityExpandButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="default"
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 h-auto"
    >
      <Wand className="h-4 w-4 mr-1" />
      Expand Activity
    </Button>
  );
}