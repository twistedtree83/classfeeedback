import React from "react";
import { ThumbsUp, ThumbsDown, Clock, Users } from "lucide-react";
import { formatTime } from "../../lib/utils";

interface StudentFeedbackMap {
  [studentName: string]: {
    feedback_type: string;
    timestamp: string;
  };
}

interface FeedbackStudentsViewProps {
  studentFeedbackMap: StudentFeedbackMap;
}

export function FeedbackStudentsView({
  studentFeedbackMap,
}: FeedbackStudentsViewProps) {
  const studentsWithFeedback = Object.keys(studentFeedbackMap);

  const getFeedbackIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case "understand":
        return <ThumbsUp className="h-4 w-4 text-teal" />;
      case "confused":
        return <ThumbsDown className="h-4 w-4 text-coral" />;
      case "slower":
        return <Clock className="h-4 w-4 text-orange" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
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

  const getFeedbackBadgeClass = (feedbackType: string) => {
    switch (feedbackType) {
      case "understand":
        return "bg-teal/10 text-teal border-teal/20";
      case "confused":
        return "bg-coral/10 text-coral border-coral/20";
      case "slower":
        return "bg-orange/10 text-orange border-orange/20";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (studentsWithFeedback.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No student feedback for this card yet</p>
        <p className="text-sm">
          Student feedback will appear here as they interact
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium mb-3 text-gray-800 flex items-center">
        <Users className="h-4 w-4 mr-2 text-gray-600" />
        Student Feedback ({studentsWithFeedback.length})
      </h3>

      <div className="space-y-2">
        {studentsWithFeedback.map((studentName) => {
          const studentFeedback = studentFeedbackMap[studentName];

          return (
            <div
              key={studentName}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getFeedbackIcon(studentFeedback.feedback_type)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{studentName}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(studentFeedback.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFeedbackBadgeClass(
                    studentFeedback.feedback_type
                  )}`}
                >
                  {getFeedbackIcon(studentFeedback.feedback_type)}
                  <span className="ml-1">
                    {getFeedbackLabel(studentFeedback.feedback_type)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-gray-500 text-center mt-4">
        Showing feedback for current card
      </div>
    </div>
  );
}
