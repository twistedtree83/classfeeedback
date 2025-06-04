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
  onGenerateDifferentiated: () => Promise<void>;
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
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-antique">
      <div 
        className="prose max-w-none text-slate-blue"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
      />
      
      {/* Differentiation Controls */}
      {hasDifferentiatedContent ? (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onToggleDifferentiatedView}
            variant={viewingDifferentiated ? "primary" : "outline"}
            size="sm"
            className={viewingDifferentiated ? 
              "bg-sage hover:bg-sage/90 text-white" : 
              "border-sage text-sage hover:bg-sage/10 flex items-center gap-1"}
          >
            <Split className="h-4 w-4 mr-1" />
            {viewingDifferentiated ? "Standard View" : "Simplified View"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-sage/10 border border-sage/30 rounded-lg">
          <p className="text-slate-blue mb-2">Need a simpler explanation?</p>
          <Button
            variant="outline"
            className="bg-sage/20 border-sage/30 text-slate-blue hover:bg-sage/30"
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