import React, { useState } from "react";
import { expandActivity } from "../lib/ai";
import { Button } from "./ui/Button";
import { Loader2, Wand, X } from "lucide-react";

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

  const handleUse = () => {
    if (expanded) {
      console.log("Using expanded activity:", expanded);
      onExpandedActivity(expanded);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-teal">Expand Activity</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-teal/5 border border-teal/20 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1 font-medium">Original Activity:</div>
            <div className="text-gray-800 font-medium">{activity}</div>
          </div>

          {!expanded ? (
            <div className="flex flex-col items-center py-6">
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
                  <Wand className="h-4 w-4 mr-2" />
                  Expand Activity
                </Button>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1 font-medium">Expanded Description:</div>
              <div className="text-gray-800">{expanded}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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