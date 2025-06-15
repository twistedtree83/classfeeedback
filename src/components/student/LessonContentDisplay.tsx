import React, { useState, useEffect } from "react";
import { Split, Loader2, Paperclip, Clock, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { sanitizeHtml } from "../../lib/utils";
import { CardAttachment } from "@/lib/types";
import { AttachmentDisplay } from "../AttachmentDisplay";

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
  onGenerateDifferentiated
}: LessonContentDisplayProps) {
  // For debugging
  useEffect(() => {
    console.log("LessonContentDisplay props:", {
      title,
      hasExtension: !!extensionActivity,
      showExtension: showExtensionActivity,
      extensionContent: extensionActivity?.substring(0, 50) + "..."
    });
  }, [title, extensionActivity, showExtensionActivity]);

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
      <div 
        className="prose max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
      />
      
      {/* Extension Activity */}
      {showExtensionActivity && extensionActivity && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold flex items-center text-purple-700 mb-3">
            <Sparkles className="h-5 w-5 mr-2" />
            Extension Activity
          </h3>
          <div className="p-5 bg-purple-50 border border-purple-100 rounded-lg shadow-sm">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeHtml(extensionActivity)
              }}
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
      
      {/* Differentiation Controls */}
      {hasDifferentiatedContent ? (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onToggleDifferentiatedView}
            variant={viewingDifferentiated ? "primary" : "outline"}
            size="sm"
            className={viewingDifferentiated ? 
              "bg-teal hover:bg-teal/90 text-white" : 
              "border-teal text-teal hover:bg-teal/10 flex items-center gap-1"}
          >
            <Split className="h-4 w-4 mr-1" />
            {viewingDifferentiated ? "Standard View" : "Simplified View"}
          </Button>
        </div>
      ) : (
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
    </div>
  );
}