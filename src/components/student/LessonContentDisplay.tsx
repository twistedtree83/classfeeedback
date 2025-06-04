import React from 'react';
import { Split, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { sanitizeHtml } from '../../lib/utils';

interface LessonContentDisplayProps {
  content: string;
  hasDifferentiatedContent: boolean;
  viewingDifferentiated: boolean;
  generatingDifferentiated: boolean;
  onToggleDifferentiatedView: () => void;
  onGenerateDifferentiated: () => void;
}

export function LessonContentDisplay({
  content,
  hasDifferentiatedContent,
  viewingDifferentiated,
  generatingDifferentiated,
  onToggleDifferentiatedView,
  onGenerateDifferentiated
}: LessonContentDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
      />
      
      {/* Differentiation Controls */}
      {hasDifferentiatedContent ? (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onToggleDifferentiatedView}
            variant={viewingDifferentiated ? "primary" : "outline"}
            size="sm"
            className="flex items-center gap-1"
          >
            <Split className="h-4 w-4 mr-1" />
            {viewingDifferentiated ? "Standard View" : "Simplified View"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
          <p className="text-purple-800 mb-2">Need a simpler explanation?</p>
          <Button
            variant="outline"
            className="bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200"
            onClick={onGenerateDifferentiated}
            disabled={generatingDifferentiated}
          >
            {generatingDifferentiated ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Simplifying...
              </>
            ) : (
              <>
                <Split className="h-4 w-4 mr-2" />
                Simplify Content
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}