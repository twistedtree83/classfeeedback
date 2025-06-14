import React, { useState } from "react";
import { expandActivity } from "../lib/ai";
import { Button } from "./ui/Button";
import { Loader2, CornerDownRight, Copy } from "lucide-react";
import { sanitizeHtml } from "../lib/utils";

interface ActivityExpanderProps {
  activity: string;
  context?: string;
  level?: string;
  onExpandedActivity: (expanded: string) => void;
  onClose: () => void;
}

export function ActivityExpander({
  activity,
  context,
  level,
  onExpandedActivity,
  onClose,
}: ActivityExpanderProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExpandActivity = async () => {
    setIsExpanding(true);
    setError(null);

    try {
      const expandedActivity = await expandActivity(activity, context, level);
      setExpanded(expandedActivity);
    } catch (err) {
      console.error("Error expanding activity:", err);
      setError("Failed to expand activity. Please try again.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (expanded) {
      navigator.clipboard.writeText(expanded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUse = () => {
    if (expanded) {
      onExpandedActivity(expanded);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] shadow-xl border border-teal/20 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-teal/20">
          <h2 className="text-xl font-bold text-teal">Expand Activity Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Use AI to expand this brief activity into detailed instructions
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Original activity */}
          <div className="bg-teal/5 border border-teal/20 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1 font-medium">Original Activity:</div>
            <div className="text-gray-800 font-medium">{activity}</div>
          </div>

          {/* Expansion button or expanded content */}
          {!expanded ? (
            <div className="flex flex-col items-center py-8">
              {isExpanding ? (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-teal mx-auto mb-4" />
                  <p className="text-gray-600">Expanding activity with AI...</p>
                </div>
              ) : (
                <Button
                  onClick={handleExpandActivity}
                  className="bg-teal hover:bg-teal/90 text-white"
                >
                  <CornerDownRight className="h-4 w-4 mr-2" />
                  Expand with AI
                </Button>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="text-gray-600"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white prose max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(expanded) }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {expanded && (
            <Button
              className="bg-teal hover:bg-teal/90 text-white"
              onClick={handleUse}
            >
              Use Expanded Activity
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}