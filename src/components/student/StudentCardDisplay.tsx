import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/Button";
import { Split, Loader2 } from "lucide-react";
import { generateDifferentiatedContent } from "../../lib/ai";
import { sanitizeHtml } from "../../lib/utils";
import type { LessonCard } from "../../lib/types";

interface StudentCardDisplayProps {
  card: LessonCard;
  level?: string;
}

export function StudentCardDisplay({ card, level }: StudentCardDisplayProps) {
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] =
    useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasDifferentiatedContent = card?.differentiatedContent ? true : false;

  // Scroll to top when card changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Reset differentiated view when card changes
    setViewingDifferentiated(false);
  }, [card.id]);

  const toggleDifferentiatedView = () => {
    if (hasDifferentiatedContent) {
      setViewingDifferentiated(!viewingDifferentiated);
    }
  };

  const handleGenerateDifferentiated = async () => {
    if (generatingDifferentiated) return;

    setGeneratingDifferentiated(true);
    try {
      const differentiatedContent = await generateDifferentiatedContent(
        card.content,
        card.type,
        level || ""
      );

      // Update the card with differentiated content (this would need to be handled by parent)
      // For now, we'll just enable the view
      if (differentiatedContent) {
        // You might want to emit this to parent component to update the card
        setViewingDifferentiated(true);
      }
    } catch (error) {
      console.error("Error generating differentiated content:", error);
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  const displayContent =
    viewingDifferentiated && card.differentiatedContent
      ? card.differentiatedContent
      : card.content;

  // Enhanced content renderer with proper heading levels
  const renderContent = () => {
    return (
      <div
        className="prose prose-lg max-w-none overflow-y-auto max-h-96
                   prose-headings:font-semibold prose-headings:text-gray-800 
                   prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                   prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                   prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
                   prose-p:text-gray-700 prose-p:leading-relaxed
                   prose-li:text-gray-700 prose-li:my-1
                   prose-strong:font-semibold prose-strong:text-gray-800"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(displayContent),
        }}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {card.title}
            </h2>
            {card.duration && (
              <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md inline-block">
                Duration: {card.duration}
              </div>
            )}
          </div>

          {/* Differentiation Controls */}
          <div className="flex gap-2">
            {hasDifferentiatedContent && (
              <Button
                onClick={toggleDifferentiatedView}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${
                  viewingDifferentiated
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : ""
                }`}
              >
                <Split className="h-4 w-4" />
                {viewingDifferentiated ? "Show Original" : "Show Simplified"}
              </Button>
            )}

            {!hasDifferentiatedContent && (
              <Button
                onClick={handleGenerateDifferentiated}
                disabled={generatingDifferentiated}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {generatingDifferentiated ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Split className="h-4 w-4" />
                )}
                {generatingDifferentiated ? "Creating..." : "Make Simpler"}
              </Button>
            )}
          </div>
        </div>

        {/* Content Display */}
        <div
          ref={contentRef}
          className="overflow-y-auto max-h-96"
        >
          {renderContent()}
        </div>

        {/* Differentiated Content Indicator */}
        {viewingDifferentiated && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">
              📚 You're viewing simplified content designed for different
              learning styles
            </p>
          </div>
        )}

        {/* Attachments */}
        {card.attachments && card.attachments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-base font-medium text-gray-700 mb-3">
              Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {card.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {attachment.type === "image" && (
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      📷
                    </div>
                  )}
                  {attachment.type === "file" && (
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      📄
                    </div>
                  )}
                  {attachment.type === "link" && (
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      🔗
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {attachment.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}