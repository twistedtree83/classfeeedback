import React, { useState, useEffect } from "react";
import { expandActivity } from "../lib/ai";
import { Button } from "./ui/Button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Wand,
  BookOpen,
} from "lucide-react";

interface Activity {
  id: string;
  content: string;
  expanded: string;
  isSelected: boolean;
  isExpanding: boolean;
  section: string;
  index: number;
}

interface SectionActivity {
  section: string;
  sectionIndex: number;
  activities: string[];
}

interface ActivityBulkExpanderProps {
  activities: SectionActivity[];
  lessonTitle: string;
  lessonLevel: string;
  onClose: () => void;
  onSaveExpanded: (
    updates: { sectionIndex: number; activityIndex: number; expanded: string }[]
  ) => void;
}

export function ActivityBulkExpander({
  activities,
  lessonTitle,
  lessonLevel,
  onClose,
  onSaveExpanded,
}: ActivityBulkExpanderProps) {
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCount, setExpandedCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Flatten activities from sections into a single list
  useEffect(() => {
    const flattenedActivities: Activity[] = [];
    activities.forEach((section, sectionIndex) => {
      section.activities.forEach((content, index) => {
        if (content.trim()) {
          flattenedActivities.push({
            id: `${sectionIndex}-${index}`,
            content,
            expanded: "",
            isSelected: content.length < 100, // Auto-select short activities
            isExpanding: false,
            section: section.section,
            index,
          });
        }
      });
    });

    setActivityList(flattenedActivities);
    setSelectedCount(
      flattenedActivities.filter((a) => a.isSelected).length
    );
  }, [activities]);

  const handleSelectAll = () => {
    setActivityList((prev) =>
      prev.map((activity) => ({
        ...activity,
        isSelected: true,
      }))
    );
    setSelectedCount(activityList.length);
  };

  const handleUnselectAll = () => {
    setActivityList((prev) =>
      prev.map((activity) => ({
        ...activity,
        isSelected: false,
      }))
    );
    setSelectedCount(0);
  };

  const toggleActivitySelection = (id: string) => {
    setActivityList((prev) =>
      prev.map((activity) => {
        if (activity.id === id) {
          const newIsSelected = !activity.isSelected;
          return {
            ...activity,
            isSelected: newIsSelected,
          };
        }
        return activity;
      })
    );

    // Update selected count
    setSelectedCount((prev) =>
      activityList.find((a) => a.id === id)?.isSelected
        ? prev - 1
        : prev + 1
    );
  };

  const handleExpandAll = async () => {
    if (isProcessing) return;
    
    const selectedActivities = activityList.filter((a) => a.isSelected);
    if (selectedActivities.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setExpandedCount(0);
    
    const updatedActivities = [...activityList];
    
    // Process each selected activity sequentially
    for (let i = 0; i < selectedActivities.length; i++) {
      const activity = selectedActivities[i];
      const activityIndex = activityList.findIndex((a) => a.id === activity.id);
      
      if (activityIndex === -1) continue;
      
      // Mark as expanding
      updatedActivities[activityIndex] = {
        ...updatedActivities[activityIndex],
        isExpanding: true,
      };
      setActivityList(updatedActivities);

      try {
        // Expand the activity
        const expanded = await expandActivity(
          activity.content,
          lessonTitle,
          lessonLevel
        );
        
        // Update with expanded content
        updatedActivities[activityIndex] = {
          ...updatedActivities[activityIndex],
          expanded,
          isExpanding: false,
        };
        setActivityList(updatedActivities);
        setExpandedCount((prev) => prev + 1);
      } catch (error) {
        console.error("Error expanding activity:", error);
        // Mark as not expanding, but keep as selected
        updatedActivities[activityIndex] = {
          ...updatedActivities[activityIndex],
          isExpanding: false,
        };
      }

      // Update progress
      setProgress(Math.round(((i + 1) / selectedActivities.length) * 100));
      
      // Add a small delay to avoid rate limits
      if (i < selectedActivities.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    
    setIsProcessing(false);
  };

  const handleSaveChanges = () => {
    const updates = activityList
      .filter((a) => a.isSelected && a.expanded)
      .map((activity) => {
        const [sectionIndex, activityIndex] = activity.id.split('-').map(Number);
        return {
          sectionIndex,
          activityIndex,
          expanded: activity.expanded,
        };
      });
    
    onSaveExpanded(updates);
  };

  const expandedActivities = activityList.filter((a) => a.expanded);
  const hasExpanded = expandedActivities.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Wand className="h-5 w-5 text-teal" />
            Expand Brief Activities
          </h2>
          <p className="text-gray-600 mt-1">
            Enhance your activities with concise, detailed descriptions for better teacher guidance
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress bar */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-teal" />
                  <span>
                    Expanding activities ({expandedCount}/{selectedCount})
                  </span>
                </div>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {activityList.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activities found in this lesson plan</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Activities to Expand
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isProcessing}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnselectAll}
                    disabled={isProcessing}
                  >
                    Unselect All
                  </Button>
                  <Button
                    disabled={selectedCount === 0 || isProcessing}
                    size="sm"
                    onClick={handleExpandAll}
                    className="bg-teal text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Expanding...
                      </>
                    ) : (
                      <>
                        <Wand className="h-4 w-4 mr-1" />
                        Expand {selectedCount} Activities
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activityList.map((activity) => (
                  <div
                    key={activity.id}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      activity.isSelected
                        ? "border-teal/50 bg-teal/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleActivitySelection(activity.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={activity.isSelected}
                          onChange={() => toggleActivitySelection(activity.id)}
                          className="mt-1 h-4 w-4 text-teal"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {activity.section}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {activity.content}
                          </p>
                          {activity.isExpanding && (
                            <div className="flex items-center mt-2 text-xs text-teal">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Expanding...
                            </div>
                          )}

                          {activity.expanded && (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="text-xs text-teal font-medium mb-1">Expanded:</div>
                              <p className="text-sm text-gray-700">{activity.expanded}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {hasExpanded && (
              <span>{expandedActivities.length} activities expanded</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              className="bg-teal hover:bg-teal/90 text-white"
              onClick={handleSaveChanges}
              disabled={isProcessing || !hasExpanded}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Save Expanded Activities
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}