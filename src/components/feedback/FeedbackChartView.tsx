import React from "react";
import { ThumbsUp, ThumbsDown, Clock, MessageSquare } from "lucide-react";
import { Button } from "../ui/Button";

interface FeedbackCounts {
  understand: number;
  confused: number;
  slower: number;
  total: number;
}

interface Question {
  id: string;
  student_name: string;
  question: string;
  answered: boolean;
  created_at: string;
  card_index?: number;
}

interface FeedbackChartViewProps {
  feedbackCounts: FeedbackCounts;
  questions: Question[];
  onViewQuestions: () => void;
}

export function FeedbackChartView({
  feedbackCounts,
  questions,
  onViewQuestions,
}: FeedbackChartViewProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <ThumbsUp className="h-5 w-5 text-teal mr-2" />
            <span className="text-gray-800">Understanding</span>
          </div>
          <span className="font-medium text-gray-800">
            {feedbackCounts.understand}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-teal h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${
                feedbackCounts.total
                  ? (feedbackCounts.understand / feedbackCounts.total) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <ThumbsDown className="h-5 w-5 text-coral mr-2" />
            <span className="text-gray-800">Confusion</span>
          </div>
          <span className="font-medium text-gray-800">
            {feedbackCounts.confused}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-coral h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${
                feedbackCounts.total
                  ? (feedbackCounts.confused / feedbackCounts.total) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-orange mr-2" />
            <span className="text-gray-800">Slow Down</span>
          </div>
          <span className="font-medium text-gray-800">
            {feedbackCounts.slower}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-orange h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${
                feedbackCounts.total
                  ? (feedbackCounts.slower / feedbackCounts.total) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Total feedback: {feedbackCounts.total}
      </div>

      {/* Quick access to questions if there are any */}
      {questions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium flex items-center text-gray-800">
              <MessageSquare className="h-4 w-4 mr-2 text-coral" />
              Questions ({questions.length})
            </h3>
            <Button
              variant="link"
              size="sm"
              onClick={onViewQuestions}
              className="text-coral"
            >
              View All
            </Button>
          </div>
          {questions.slice(0, 2).map((item) => (
            <div key={item.id} className="text-sm mb-2 p-2 bg-teal/5 rounded">
              <p className="font-medium text-gray-800">{item.student_name}:</p>
              <p className="text-gray-700 truncate">{item.question}</p>
            </div>
          ))}
          {questions.length > 2 && (
            <div className="text-sm text-center text-coral">
              +{questions.length - 2} more questions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
