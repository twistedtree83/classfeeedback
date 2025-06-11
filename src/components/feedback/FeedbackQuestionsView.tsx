import React from "react";
import { Check, Clock, MessageSquare } from "lucide-react";
import { formatTime } from "../../lib/utils";
import { Button } from "../ui/Button";

interface Question {
  id: string;
  student_name: string;
  question: string;
  answered: boolean;
  created_at: string;
  card_index?: number;
}

interface FeedbackQuestionsViewProps {
  questions: Question[];
  onMarkAsAnswered: (questionId: string) => Promise<boolean>;
  filterCurrentCard: boolean;
  currentCardIndex?: number;
}

export function FeedbackQuestionsView({
  questions,
  onMarkAsAnswered,
  filterCurrentCard,
  currentCardIndex,
}: FeedbackQuestionsViewProps) {
  // Filter questions based on current card if enabled
  const filteredQuestions =
    filterCurrentCard && currentCardIndex !== undefined
      ? questions.filter((q) => q.card_index === currentCardIndex)
      : questions;

  const unansweredQuestions = filteredQuestions.filter((q) => !q.answered);
  const answeredQuestions = filteredQuestions.filter((q) => q.answered);

  if (filteredQuestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No questions yet</p>
        <p className="text-sm">
          Students can ask questions about your teaching content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 text-gray-800 flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-coral" />
            New Questions ({unansweredQuestions.length})
          </h3>
          <div className="space-y-3">
            {unansweredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-coral/5 border border-coral/20 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {question.student_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(question.created_at)}
                      {question.card_index !== undefined &&
                        !filterCurrentCard && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            Card {question.card_index + 1}
                          </span>
                        )}
                    </p>
                  </div>
                  <Button
                    onClick={() => onMarkAsAnswered(question.id)}
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Answered
                  </Button>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {question.question}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered Questions */}
      {answeredQuestions.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 text-gray-800 flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Answered Questions ({answeredQuestions.length})
          </h3>
          <div className="space-y-3">
            {answeredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4 opacity-75"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {question.student_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(question.created_at)}
                      {question.card_index !== undefined &&
                        !filterCurrentCard && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            Card {question.card_index + 1}
                          </span>
                        )}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Answered
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {question.question}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
