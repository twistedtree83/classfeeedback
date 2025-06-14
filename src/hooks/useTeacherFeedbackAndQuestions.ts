import { useState, useEffect } from "react";
import {
  getTeachingFeedbackForPresentation,
  getTeachingQuestionsForPresentation,
  getExtensionRequestsForPresentation,
  subscribeToTeachingFeedback,
  subscribeToTeachingQuestions,
  subscribeToExtensionRequests,
  markQuestionAsAnswered,
  approveExtensionRequest,
  rejectExtensionRequest,
  ExtensionRequest
} from "../lib/supabase";

export function useTeacherFeedbackAndQuestions(
  presentationId: string | undefined,
  cardIndex?: number
) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const [hasNewExtensionRequests, setHasNewExtensionRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial feedback, questions, and extension requests
  useEffect(() => {
    if (!presentationId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [feedbackData, questionsData, extensionData] = await Promise.all([
          getTeachingFeedbackForPresentation(presentationId, cardIndex),
          getTeachingQuestionsForPresentation(presentationId),
          getExtensionRequestsForPresentation(presentationId)
        ]);

        setFeedback(feedbackData);
        setQuestions(questionsData);
        setExtensionRequests(extensionData);
        
        // Check if there are new questions or extension requests
        setHasNewQuestions(questionsData.some(q => !q.answered));
        setHasNewExtensionRequests(extensionData.some(e => e.status === 'pending'));
      } catch (err) {
        console.error("Error loading feedback, questions, and extension requests:", err);
        setError("Failed to load feedback and questions");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [presentationId, cardIndex]);

  // Subscribe to real-time feedback
  useEffect(() => {
    if (!presentationId) return;

    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        // If cardIndex is specified, only add feedback for that card
        if (cardIndex !== undefined && newFeedback.card_index !== cardIndex) {
          return;
        }
        setFeedback((prev) => [newFeedback, ...prev]);
      },
      cardIndex
    );

    return () => {
      feedbackSubscription.unsubscribe();
    };
  }, [presentationId, cardIndex]);

  // Subscribe to real-time questions
  useEffect(() => {
    if (!presentationId) return;

    const questionSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        // If cardIndex is specified, only add questions for that card
        if (cardIndex !== undefined && newQuestion.card_index !== cardIndex) {
          return;
        }
        setQuestions((prev) => [newQuestion, ...prev]);
        setHasNewQuestions(true);
      },
      cardIndex
    );

    return () => {
      questionSubscription.unsubscribe();
    };
  }, [presentationId, cardIndex]);
  
  // Subscribe to extension requests
  useEffect(() => {
    if (!presentationId) return;
    
    const extensionSubscription = subscribeToExtensionRequests(
      presentationId,
      (newRequest) => {
        // Handle new or updated extension requests
        setExtensionRequests(prev => {
          // Check if this is an update to an existing request
          const existingIndex = prev.findIndex(r => r.id === newRequest.id);
          
          if (existingIndex >= 0) {
            // Update existing request
            const updated = [...prev];
            updated[existingIndex] = newRequest;
            return updated;
          } else {
            // Add new request
            if (newRequest.status === 'pending') {
              setHasNewExtensionRequests(true);
            }
            return [newRequest, ...prev];
          }
        });
      }
    );
    
    return () => {
      extensionSubscription.unsubscribe();
    };
  }, [presentationId]);

  // Handler for marking questions as answered
  const handleMarkAsAnswered = async (questionId: string) => {
    try {
      const success = await markQuestionAsAnswered(questionId);
      if (success) {
        // Update local state
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) =>
            q.id === questionId ? { ...q, answered: true } : q
          )
        );
        // Check if there are still new questions
        const newQuestionsExist = questions.some(
          (q) => !q.answered && q.id !== questionId
        );
        if (!newQuestionsExist) {
          setHasNewQuestions(false);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error marking question as answered:", error);
      return false;
    }
  };
  
  // Handler for approving extension requests
  const handleApproveExtension = async (requestId: string) => {
    try {
      const success = await approveExtensionRequest(requestId);
      if (success) {
        // Update local state
        setExtensionRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { ...request, status: 'approved' } 
              : request
          )
        );
        
        // Check if there are still pending requests
        const pendingExists = extensionRequests.some(
          r => r.status === 'pending' && r.id !== requestId
        );
        if (!pendingExists) {
          setHasNewExtensionRequests(false);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error approving extension request:', error);
      return false;
    }
  };
  
  // Handler for rejecting extension requests
  const handleRejectExtension = async (requestId: string) => {
    try {
      const success = await rejectExtensionRequest(requestId);
      if (success) {
        // Update local state
        setExtensionRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { ...request, status: 'rejected' } 
              : request
          )
        );
        
        // Check if there are still pending requests
        const pendingExists = extensionRequests.some(
          r => r.status === 'pending' && r.id !== requestId
        );
        if (!pendingExists) {
          setHasNewExtensionRequests(false);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rejecting extension request:', error);
      return false;
    }
  };

  // Group feedback by type for statistics
  const feedbackCounts = {
    understand: feedback.filter((f) => f.feedback_type === "understand").length,
    confused: feedback.filter((f) => f.feedback_type === "confused").length,
    slower: feedback.filter((f) => f.feedback_type === "slower").length,
    total: feedback.length,
  };

  // New questions count
  const newQuestionsCount = questions.filter((q) => !q.answered).length;
  
  // Pending extension requests count
  const pendingExtensionCount = extensionRequests.filter(r => r.status === 'pending').length;
  
  // Get only pending extension requests for display
  const pendingExtensionRequests = extensionRequests.filter(r => r.status === 'pending');

  return {
    feedback,
    questions,
    extensionRequests,
    pendingExtensionRequests,
    feedbackCounts,
    newQuestionsCount,
    pendingExtensionCount,
    hasNewQuestions,
    hasNewExtensionRequests,
    loading,
    error,
    handleMarkAsAnswered,
    handleApproveExtension,
    handleRejectExtension,
    clearHasNewQuestions: () => setHasNewQuestions(false),
    clearHasNewExtensionRequests: () => setHasNewExtensionRequests(false)
  };
}