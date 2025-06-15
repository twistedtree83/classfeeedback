import React, { useState } from "react";
import { 
  MessageSquare, 
  BarChart3, 
  List, 
  Bell, 
  Users,
  Sparkles
} from "lucide-react";
import { Button } from "../ui/Button";
import { useTeacherFeedbackAndQuestions } from "../../hooks/useTeacherFeedbackAndQuestions";
import { FeedbackChartView } from "../feedback/FeedbackChartView";
import { FeedbackQuestionsView } from "../feedback/FeedbackQuestionsView";
import { FeedbackStudentsView } from "../feedback/FeedbackStudentsView";
import { FeedbackListView } from "../feedback/FeedbackListView";
import { ExtensionRequestsView } from "./feedback/ExtensionRequestsView";

interface TeachingFeedbackPanelProps {
  presentationId: string;
  currentCardIndex?: number;
}

export function TeachingFeedbackPanel({
  presentationId,
  currentCardIndex,
}: TeachingFeedbackPanelProps) {
  const [view, setView] = useState<"chart" | "list" | "questions" | "students" | "extensions">("chart");
  const [filterCurrentCard, setFilterCurrentCard] = useState(true);

  const {
    feedback,
    questions,
    extensionRequests,
    loading,
    newQuestionsCount,
    pendingExtensionCount,
    hasNewQuestions,
    hasNewExtensionRequests,
    studentFeedbackMap,
    feedbackCounts,
    handleMarkAsAnswered,
    handleApproveExtension,
    handleRejectExtension
  } = useTeacherFeedbackAndQuestions(presentationId, currentCardIndex);

  if (loading) {
    return (
      <div className="w-full p-4 bg-white rounded-xl">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl">
      <h2 className="text-xl font-bold text-teal mb-3">
        Live Feedback
        {(hasNewQuestions || hasNewExtensionRequests) && (
          <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-coral/10 text-coral">
            <Bell className="h-3 w-3 mr-1" />
            {hasNewQuestions && hasNewExtensionRequests 
              ? "New Requests" 
              : hasNewQuestions 
              ? "New Questions" 
              : "New Extension Requests"}
          </span>
        )}
      </h2>

      {/* View Toggle Buttons */}
      <div className="flex space-x-2 mb-4">
        <Button
          variant={view === "chart" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("chart")}
          className={
            view === "chart"
              ? "bg-teal hover:bg-teal/90 text-white"
              : "border-teal text-teal hover:bg-teal/10"
          }
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "students" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("students")}
          className={
            view === "students"
              ? "bg-teal hover:bg-teal/90 text-white"
              : "border-teal text-teal hover:bg-teal/10"
          }
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("list")}
          className={
            view === "list"
              ? "bg-teal hover:bg-teal/90 text-white"
              : "border-teal text-teal hover:bg-teal/10"
          }
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "questions" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("questions")}
          className={`relative ${
            view === "questions"
              ? "bg-teal hover:bg-teal/90 text-white"
              : "border-teal text-teal hover:bg-teal/10"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {newQuestionsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {newQuestionsCount}
            </span>
          )}
        </Button>
        <Button
          variant={view === "extensions" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("extensions")}
          className={`relative ${
            view === "extensions"
              ? "bg-teal hover:bg-teal/90 text-white"
              : "border-teal text-teal hover:bg-teal/10"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {pendingExtensionCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingExtensionCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Toggle */}
      <div className="mb-3 flex items-center">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-teal"
            checked={filterCurrentCard}
            onChange={() => setFilterCurrentCard(!filterCurrentCard)}
          />
          <span className="ml-2 text-sm text-gray-600">
            Show only current card feedback
          </span>
        </label>
      </div>

      {/* Render the appropriate view */}
      {view === "chart" && (
        <FeedbackChartView
          feedbackCounts={feedbackCounts}
          questions={questions}
          onViewQuestions={() => setView("questions")}
        />
      )}

      {view === "students" && (
        <FeedbackStudentsView studentFeedbackMap={studentFeedbackMap} />
      )}

      {view === "list" && (
        <FeedbackListView
          feedback={feedback}
          filterCurrentCard={filterCurrentCard}
          currentCardIndex={currentCardIndex}
        />
      )}

      {view === "questions" && (
        <FeedbackQuestionsView
          questions={questions}
          onMarkAsAnswered={handleMarkAsAnswered}
          filterCurrentCard={filterCurrentCard}
          currentCardIndex={currentCardIndex}
        />
      )}
      
      {view === "extensions" && (
        <ExtensionRequestsView
          extensionRequests={extensionRequests}
          onApprove={handleApproveExtension}
          onReject={handleRejectExtension}
          filterCurrentCard={filterCurrentCard}
          currentCardIndex={currentCardIndex}
        />
      )}
    </div>
  );
}