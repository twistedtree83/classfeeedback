import React, { useEffect, useState } from 'react';
import { Split, Loader2, Paperclip, Clock, Sparkles, BookText } from 'lucide-react';
import { Button } from '../ui/Button';
import { CardAttachment } from '@/lib/types';
import { AttachmentDisplay } from '../AttachmentDisplay';
import { VocabularyHighlighter } from '../vocabulary/VocabularyHighlighter';

interface LessonContentDisplayProps {
  title: string;
  duration?: string | null;
  content: string;
  extensionActivity?: string;
  showExtensionActivity?: boolean;
  attachments?: CardAttachment[];
  hasDifferentiatedContent: boolean;
  viewingDifferentiated: boolean;
  generatingDifferentiated: boolean;
  onToggleDifferentiatedView: () => void;
  onGenerateDifferentiated: () => Promise<void>;
  lessonId?: string;
  level?: string;
  remedialActivity?: string;
  isRemedialEnabled?: boolean;
  viewingRemedial?: boolean;
  onToggleRemedialView?: () => void;
  hasRemedialAssignment?: boolean;
}

export function LessonContentDisplay({
  title,
  duration,
  content,
  extensionActivity,
  showExtensionActivity = false,
  attachments = [],
  hasDifferentiatedContent,
  viewingDifferentiated,
  generatingDifferentiated,
  onToggleDifferentiatedView,
  onGenerateDifferentiated,
  lessonId,
  level,
  remedialActivity,
  isRemedialEnabled = false,
  viewingRemedial = false,
  onToggleRemedialView,
  hasRemedialAssignment = false
}: LessonContentDisplayProps) {
  const [showInstructionType, setShowInstructionType] = useState<'standard' | 'simplified' | 'differentiated'>('standard');

  // For debugging
  useEffect(() => {
    console.log("LessonContentDisplay props:", {
      title,
      hasExtension: !!extensionActivity,
      showExtension: showExtensionActivity,
      extensionContent: extensionActivity?.substring(0, 50) + "...",
      hasRemedial: !!remedialActivity,
      isRemedialEnabled,
      viewingRemedial
    });
  }, [title, extensionActivity, showExtensionActivity, remedialActivity, isRemedialEnabled, viewingRemedial]);

  // Update content display type based on props
  useEffect(() => {
    if (viewingRemedial && remedialActivity) {
      setShowInstructionType('simplified');
    } else if (viewingDifferentiated && hasDifferentiatedContent) {
      setShowInstructionType('differentiated');
    } else {
      setShowInstructionType('standard');
    }
  }, [viewingRemedial, viewingDifferentiated, hasDifferentiatedContent, remedialActivity]);

  // Determine which content to display
  const displayContent = () => {
    if (showInstructionType === 'simplified' && remedialActivity) {
      return remedialActivity;
    } 
    if (showInstructionType === 'differentiated' && hasDifferentiatedContent) {
      return content; // The differentiated content is already in the content prop when viewingDifferentiated is true
    }
    return content;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-teal/20">
      {/* Card Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-teal">{title}</h2>
          {duration && (
            <div className="text-sm text-coral bg-coral/10 px-3 py-1 rounded-full flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {duration}
            </div>
          )}
        </div>
      </div>
      
      {/* Card Content */}
      <VocabularyHighlighter 
        content={displayContent()}
        level={level}
        lessonId={lessonId}
      />
      
      {/* Extension Activity */}
      {showExtensionActivity && extensionActivity && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold flex items-center text-purple-700 mb-3">
            <Sparkles className="h-5 w-5 mr-2" />
            Extension Activity
          </h3>
          <div className="p-5 bg-purple-50 border border-purple-100 rounded-lg shadow-sm">
            <VocabularyHighlighter 
              content={extensionActivity}
              level={level}
              lessonId={lessonId}
            />
          </div>
        </div>
      )}
      
      {/* Attachments section */}
      {attachments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-base font-medium text-gray-700 flex items-center mb-3">
            <Paperclip className="h-5 w-5 mr-2 text-teal" />
            Resources & Downloads
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map(attachment => (
              <AttachmentDisplay 
                key={attachment.id} 
                attachment={attachment} 
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Content Display Options */}
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        {/* Simplified/Remedial View Button */}
        {remedialActivity && isRemedialEnabled && onToggleRemedialView && (
          <Button
            onClick={onToggleRemedialView}
            variant={showInstructionType === 'simplified' ? "primary" : "outline"}
            size="sm"
            className={showInstructionType === 'simplified' ? 
              "bg-purple-600 hover:bg-purple-700 text-white" : 
              "border-purple-600 text-purple-600 hover:bg-purple-50 flex items-center gap-1"}
          >
            <BookText className="h-4 w-4 mr-1" />
            {showInstructionType === 'simplified' ? "Standard View" : "Simplified View"}
          </Button>
        )}
        
        {/* Differentiated View Button */}
        {hasDifferentiatedContent && (
          <Button
            onClick={onToggleDifferentiatedView}
            variant={showInstructionType === 'differentiated' ? "primary" : "outline"}
            size="sm"
            className={showInstructionType === 'differentiated' ? 
              "bg-teal hover:bg-teal/90 text-white" : 
              "border-teal text-teal hover:bg-teal/10 flex items-center gap-1"}
          >
            <Split className="h-4 w-4 mr-1" />
            {showInstructionType === 'differentiated' ? "Standard View" : "Different Learning Styles"}
          </Button>
        )}
      </div>
      
      {/* Generate simplified version button (if no differentiated or remedial content) */}
      {!hasDifferentiatedContent && !remedialActivity && !hasRemedialAssignment && (
        <div className="mt-6 p-4 bg-orange/10 border border-orange/30 rounded-lg">
          <p className="text-gray-800 mb-2">Need a simpler explanation?</p>
          <Button
            variant="outline"
            className="bg-orange/20 border-orange/30 text-orange hover:bg-orange/30"
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
      
      {/* Remedial Assignment Indicator */}
      {hasRemedialAssignment && !remedialActivity && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-purple-800 flex items-center">
            <BookText className="h-5 w-5 mr-2" />
            <span>Your teacher has assigned you simplified content, but it's not available for this card yet.</span>
          </p>
        </div>
      )}
    </div>
  );
}