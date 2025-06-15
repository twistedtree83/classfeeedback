import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ThumbsUp, ThumbsDown, Clock, Send, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import {
  submitTeachingFeedback,
  submitTeachingQuestion,
  submitExtensionRequest,
} from "../../lib/supabase";

interface StudentFeedbackPanelProps {
  presentationId: string;
  studentName: string;
  currentCardIndex: number;
  onFeedbackSubmitted?: (type: string) => void;
  onQuestionSubmitted?: () => void;
  onExtensionRequested?: () => void;
  showExtensionButton?: boolean;
  extensionRequested?: boolean;
  extensionPending?: boolean;
  extensionApproved?: boolean;
}

export function StudentFeedbackPanel({
  presentationId,
  studentName,
  currentCardIndex,
  onFeedbackSubmitted,
  onQuestionSubmitted,
  onExtensionRequested,
  showExtensionButton = false,
  extensionRequested = false,
  extensionPending = false,
  extensionApproved = false
}: StudentFeedbackPanelProps) {
  const [question, setQuestion] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(
    null
  );
  const [feedbackCooldown, setFeedbackCooldown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [requestingExtension, setRequestingExtension] = useState(false);

  // Reset state when moving to a new card
  useEffect(() => {
    setFeedbackSubmitted(null);
    setFeedbackCooldown(false);
    setShowSuccessMessage(false);
  }, [currentCardIndex]);

  const handleFeedback = async (type: string) => {
    if (feedbackCooldown) return;

    setFeedbackCooldown(true);
    const success = await submitTeachingFeedback(
      presentationId,
      studentName,
      type,
      currentCardIndex
    );

    if (success) {
      setFeedbackSubmitted(type);
      setShowSuccessMessage(true);
      onFeedbackSubmitted?.(type);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);

      setTimeout(() => {
        setFeedbackCooldown(false);
      }, 3000);
    } else {
      setFeedbackCooldown(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || submittingQuestion) return;

    setSubmittingQuestion(true);
    console.log("Submitting question:", question);

    const success = await submitTeachingQuestion(
      presentationId,
      studentName,
      question.trim(),
      currentCardIndex
    );

    if (success) {
      console.log("Question submitted successfully");
      setQuestion("");
      onQuestionSubmitted?.();
    } else {
      console.error("Failed to submit question");
    }

    setSubmittingQuestion(false);
  };

  const handleRequestExtension = async () => {
    if (requestingExtension || extensionRequested) return;
    
    setRequestingExtension(true);
    
    try {
      // Submit the extension request to the database
      const success = await submitExtensionRequest(
        presentationId,
        studentName,
        currentCardIndex
      );
      
      if (success) {
        console.log("Extension request submitted successfully");
        if (onExtensionRequested) {
          onExtensionRequested();
        }
      } else {
        console.error("Failed to submit extension request");
      }
    } catch (error) {
      console.error("Error requesting extension:", error);
    } finally {
      setRequestingExtension(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ThumbsUp className="h-5 w-5 text-green-600" />
          How are you doing?
        </h3>

        {showSuccessMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Feedback sent to teacher!</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => handleFeedback("understand")}
            disabled={feedbackCooldown}
            className={`flex flex-col items-center gap-2 py-4 h-auto ${
              feedbackSubmitted === "understand"
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-green-50"
            }`}
            variant="outline"
          >
            <ThumbsUp className="h-6 w-6" />
            <span className="text-sm font-medium">I understand</span>
          </Button>

          <Button
            onClick={() => handleFeedback("confused")}
            disabled={feedbackCooldown}
            className={`flex flex-col items-center gap-2 py-4 h-auto ${
              feedbackSubmitted === "confused"
                ? "bg-red-100 border-red-300 text-red-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-red-50"
            }`}
            variant="outline"
          >
            <ThumbsDown className="h-6 w-6" />
            <span className="text-sm font-medium">I'm confused</span>
          </Button>

          <Button
            onClick={() => handleFeedback("slower")}
            disabled={feedbackCooldown}
            className={`flex flex-col items-center gap-2 py-4 h-auto ${
              feedbackSubmitted === "slower"
                ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-yellow-50"
            }`}
            variant="outline"
          >
            <Clock className="h-6 w-6" />
            <span className="text-sm font-medium">Go slower</span>
          </Button>
        </div>

        {feedbackCooldown && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            Thanks for the feedback! You can send more feedback in a few
            seconds.
          </p>
        )}

        {/* Extension Activity Button */}
        {showExtensionButton && !extensionRequested && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={handleRequestExtension}
              disabled={requestingExtension}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {requestingExtension ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>I'm Finished - Request Extension Activity</span>
            </Button>
          </div>
        )}

        {extensionRequested && extensionPending && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Extension activity request sent! Waiting for teacher approval...</span>
            </div>
          </div>
        )}

        {extensionApproved && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2 text-purple-700">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Extension activity approved! Scroll down to view it.</span>
            </div>
          </div>
        )}
      </div>

      {/* Question Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Ask a Question
        </h3>
        <form onSubmit={handleSubmitQuestion} className="space-y-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            disabled={submittingQuestion}
            className="w-full"
          />
          <Button
            type="submit"
            disabled={!question.trim() || submittingQuestion}
            className="w-full flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {submittingQuestion ? "Sending..." : "Send Question"}
          </Button>
        </form>
      </div>
    </div>
  );
}