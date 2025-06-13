import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { improveLessonSection } from "@/lib/aiService";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Edit,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Users,
  Package,
} from "lucide-react";
import { ImprovementArea } from "@/types/lessonTypes";
import { sanitizeHtml } from "@/lib/utils";

interface SectionImproverProps {
  improvement: ImprovementArea;
  currentValue: string | string[];
  onApprove: (id: string, newValue: string | string[]) => void;
  onCancel: () => void;
}

interface ActivitySuggestion {
  title: string;
  description: string;
  duration?: string;
  materials?: string;
  grouping?: string;
}

export function SectionImprover({
  improvement,
  currentValue,
  onApprove,
  onCancel,
}: SectionImproverProps) {
  const [editMode, setEditMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activitySuggestions, setActivitySuggestions] = useState<
    ActivitySuggestion[]
  >([]);
  const [selectedActivities, setSelectedActivities] = useState<boolean[]>([]);
  const [existingActivities, setExistingActivities] = useState<string[]>(
    Array.isArray(currentValue)
      ? [...currentValue]
      : currentValue
      ? [currentValue as string]
      : []
  );
  const [error, setError] = useState("");

  // Function to generate improved content from AI
  const generateImprovement = async () => {
    setIsGenerating(true);
    setError("");

    try {
      // For arrays (like activities), join with newlines
      const currentText = (
        Array.isArray(currentValue)
          ? currentValue
          : currentValue
          ? [currentValue as string]
          : []
      ).join("\n");

      const result = await improveLessonSection(
        improvement.section,
        currentText,
        improvement.issue
      );

      // Parse JSON response with better error handling
      try {
        const parsedResult = JSON.parse(result);
        if (parsedResult.activities && Array.isArray(parsedResult.activities)) {
          // Validate each activity has required fields
          const validActivities = parsedResult.activities.filter(
            (activity: any) =>
              activity.title &&
              activity.description &&
              typeof activity.title === "string" &&
              typeof activity.description === "string"
          );

          if (validActivities.length > 0) {
            setActivitySuggestions(validActivities);
            setSelectedActivities(
              new Array(validActivities.length).fill(false)
            );
          } else {
            throw new Error("No valid activities found in response");
          }
        } else {
          throw new Error("Invalid JSON structure - missing activities array");
        }
      } catch (parseError) {
        console.warn("Failed to parse JSON response:", parseError);
        console.warn("Raw response:", result);

        // Enhanced fallback parsing for better activity extraction
        const fallbackActivities = extractActivitiesFromText(result);
        setActivitySuggestions(fallbackActivities);
        setSelectedActivities(new Array(fallbackActivities.length).fill(false));
      }
    } catch (err) {
      console.error("Error improving section:", err);
      setError(
        "Failed to generate improvement. Please try again or edit manually."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Enhanced activity extraction for better fallback parsing
  const extractActivitiesFromText = (
    aiResponse: string
  ): ActivitySuggestion[] => {
    // Try to extract activities from unstructured text
    const lines = aiResponse.split(/\n+/);
    const activities: ActivitySuggestion[] = [];

    let currentActivity: Partial<ActivitySuggestion> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Look for activity titles (often start with numbers or bullets)
      if (
        trimmedLine.match(/^(\d+[.)]|\*|\-)\s*.{10,}/) ||
        trimmedLine.includes("Activity:") ||
        trimmedLine.includes("Exercise:")
      ) {
        // Save previous activity if it exists
        if (currentActivity.description) {
          activities.push({
            title: currentActivity.title || `Activity ${activities.length + 1}`,
            description: currentActivity.description,
            duration: currentActivity.duration || "10-15 minutes",
            materials:
              currentActivity.materials || "Standard classroom materials",
            grouping: currentActivity.grouping || "Varies",
          });
        }

        // Start new activity
        const cleanTitle = trimmedLine
          .replace(/^(\d+[.)]|\*|\-)\s*/, "")
          .replace(/^(Activity|Exercise):\s*/i, "")
          .trim();

        currentActivity = {
          title:
            cleanTitle.substring(0, 60) + (cleanTitle.length > 60 ? "..." : ""),
          description: cleanTitle,
        };
      } else if (currentActivity.title && trimmedLine.length > 20) {
        // Add to current activity description
        currentActivity.description =
          (currentActivity.description || "") +
          (currentActivity.description ? " " : "") +
          trimmedLine;
      }
    }

    // Add the last activity
    if (currentActivity.description) {
      activities.push({
        title: currentActivity.title || `Activity ${activities.length + 1}`,
        description: currentActivity.description,
        duration: currentActivity.duration || "10-15 minutes",
        materials: currentActivity.materials || "Standard classroom materials",
        grouping: currentActivity.grouping || "Varies",
      });
    }

    // If no activities found, create a generic one from the response
    if (activities.length === 0) {
      activities.push({
        title: "Suggested Activity",
        description:
          aiResponse.trim() ||
          "Please review and modify this activity as needed.",
        duration: "10-15 minutes",
        materials: "Standard classroom materials",
        grouping: "Varies",
      });
    }

    return activities;
  };

  // Clean and parse activities from AI response (legacy fallback method)
  const cleanAndParseActivities = (aiResponse: string): string[] => {
    // Split by common separators (newlines, bullet points, numbers)
    const lines = aiResponse.split(/\n+/);

    // Process each line to remove bullet points, numbering, etc.
    return lines
      .map((line) => {
        // Remove bullet points, numbers, and extra whitespace
        return line
          .trim()
          .replace(/^[•\-*]\s*/, "") // Bullet points
          .replace(/^\d+[.):]\s*/, "") // Numbering
          .trim();
      })
      .filter((line) => line.length > 0); // Remove empty lines
  };

  // Generate improvement when component mounts
  useEffect(() => {
    generateImprovement();
  }, []);

  // Handle selecting/deselecting activities
  const toggleActivitySelection = (index: number) => {
    const newSelection = [...selectedActivities];
    newSelection[index] = !newSelection[index];
    setSelectedActivities(newSelection);
  };

  // Handle editing existing activities
  const handleExistingActivityChange = (index: number, value: string) => {
    const newActivities = [...existingActivities];
    newActivities[index] = value;
    setExistingActivities(newActivities);
  };

  // Handle adding a new existing activity
  const handleAddExistingActivity = () => {
    setExistingActivities([...existingActivities, ""]);
  };

  // Handle removing an existing activity
  const handleRemoveExistingActivity = (index: number) => {
    const newActivities = [...existingActivities];
    newActivities.splice(index, 1);
    setExistingActivities(newActivities);
  };

  // Handle approving the changes
  const handleApprove = () => {
    const selectedSuggestions = activitySuggestions
      .filter((_, index) => selectedActivities[index])
      .map((suggestion) => suggestion.description);

    const finalActivities = [
      ...existingActivities.filter((act) => act.trim()),
      ...selectedSuggestions,
    ];
    onApprove(improvement.id, finalActivities);
  };

  const hasSelectedActivities = selectedActivities.some((selected) => selected);
  const hasValidExistingActivities = existingActivities.some((act) =>
    act.trim()
  );

  return (
    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
      {/* Issue and Suggestion */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          {improvement.section}
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
          <p className="text-amber-800">
            <strong>Issue:</strong> {improvement.issue}
          </p>
          <p className="text-amber-700 mt-1">
            <strong>Suggestion:</strong> {improvement.suggestion}
          </p>
        </div>
      </div>

      {/* Current Activities Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            Current Activities:
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            {editMode ? "Done Editing" : "Edit Current"}
          </Button>
        </div>

        {editMode ? (
          <div className="space-y-3">
            {existingActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-2">
                <textarea
                  value={activity}
                  onChange={(e) =>
                    handleExistingActivityChange(index, e.target.value)
                  }
                  className="flex-1 p-3 border border-blue-200 rounded focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  rows={3}
                  placeholder={`Activity ${index + 1} description...`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500"
                  onClick={() => handleRemoveExistingActivity(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddExistingActivity}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {hasValidExistingActivities ? (
              <ul className="list-disc pl-5 space-y-2">
                {existingActivities
                  .filter((act) => act.trim())
                  .map((item, i) => (
                    <li
                      key={i}
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}
                    ></li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">
                No current activities defined
              </p>
            )}
          </div>
        )}
      </div>

      {/* AI Generated Activities Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          AI-Generated Activity Suggestions:
          <span className="text-xs text-gray-500 ml-2">
            (Select the ones you want to add)
          </span>
        </h4>

        {isGenerating ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
            <span>Generating improved activities...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {activitySuggestions.map((activity, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedActivities[index]
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
                onClick={() => toggleActivitySelection(index)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedActivities[index]}
                    onChange={() => toggleActivitySelection(index)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900">
                        {activity.title}
                      </h5>
                    </div>

                    <div
                      className="text-gray-700 mb-3"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(activity.description),
                      }}
                    />

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {activity.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{activity.duration}</span>
                        </div>
                      )}
                      {activity.grouping && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{activity.grouping}</span>
                        </div>
                      )}
                      {activity.materials && (
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{activity.materials}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activitySuggestions.length === 0 && (
              <div className="text-gray-400 italic p-4 bg-gray-50 rounded-lg">
                No activities generated yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-blue-200">
        <div className="text-sm text-gray-600">
          {hasSelectedActivities && (
            <span className="text-blue-600">
              {selectedActivities.filter((s) => s).length} activity(ies)
              selected
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            <XCircle className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={
              isGenerating ||
              (!hasSelectedActivities && !hasValidExistingActivities)
            }
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Apply Selected Activities
          </Button>
        </div>
      </div>
    </div>
  );
}
