import React from "react";
import { ThumbsUp, ThumbsDown, Clock, List } from "lucide-react";
import { formatTime } from "../../lib/utils";

interface Feedback {
  id: string;
  student_name: string;
  feedback_type: string;
  content: string | null;
  created_at: string;
  card_index?: number;
}

interface FeedbackListViewProps {
  feedback: Feedback[];
  filterCurrentCard: boolean;
  currentCardIndex?: number;
}

export function FeedbackListView({
  feedback,
  filterCurrentCard,
  currentCardIndex,
}: FeedbackListViewProps) {
  // Filter feedback based on current card if enabled
  const filteredFeedback =
    filterCurrentCard && currentCardIndex !== undefined
      ? feedback.filter((f) => f.card_index === currentCardIndex)
      : feedback;

  const getFeedbackIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case "understand":
        return <ThumbsUp className="h-4 w-4 text-teal" />;
      case "confused":
        return <ThumbsDown className="h-4 w-4 text-coral" />;
      case "slower":
        return <Clock className="h-4 w-4 text-orange" />;
      default:
        return <List className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFeedbackLabel = (feedbackType: string) => {
    switch (feedbackType) {
      case "understand":
        return "Understanding";
      case "confused":
        return "Confused";
      case "slower":
        return "Slow Down";
      default:
        return "Unknown";
    }
  };

  const getFeedbackBgClass = (feedbackType: string) => {
    switch (feedbackType) {
      case "understand":
        return "bg-teal/5 border-teal/20";
      case "confused":
        return "bg-coral/5 border-coral/20";
      case "slower":
        return "bg-orange/5 border-orange/20";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (filteredFeedback.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <List className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No feedback yet</p>
        <p className="text-sm">
          {filterCurrentCard
            ? "No feedback for this card yet"
            : "Student feedback will appear here as they interact"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium mb-3 text-gray-800 flex items-center">
        <List className="h-4 w-4 mr-2 text-gray-600" />
        All Feedback ({filteredFeedback.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredFeedback.map((item) => (
          <div
            key={item.id}
            className={`p-3 border rounded-lg ${getFeedbackBgClass(
              item.feedback_type
            )}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getFeedbackIcon(item.feedback_type)}
                <div>
                  <p className="font-medium text-gray-800">
                    {item.student_name}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(item.created_at)}
                    {item.card_index !== undefined && !filterCurrentCard && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        Card {item.card_index + 1}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <span className="text-sm font-medium text-gray-700">
                {getFeedbackLabel(item.feedback_type)}
              </span>
            </div>

            {item.content && (
              <p className="text-gray-700 text-sm mt-2 pl-6">
                "{item.content}"
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 text-center">
        {filterCurrentCard
          ? "Showing feedback for current card only"
          : "Showing all feedback from this session"}
      </div>
    </div>
  );
}
