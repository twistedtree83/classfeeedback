import { useState, useEffect, useCallback } from "react";
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
  const [subscriptions, setSubscriptions] = useState<{ unsubscribe: () => void }[]>([]);

  // Load initial feedback, questions, and extension requests
  useEffect(() => {
    if (!presentationId) return;

    // Clean up any existing subscriptions first
    subscriptions.forEach(sub => sub.unsubscribe());
    setSubscriptions([]);

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

        console.log(`Initial load: ${feedbackData.length} feedback items, ${questionsData.length} questions, ${extensionData.length} extension requests`);
        console.log(`Has new questions: ${questionsData.some(q => !q.answered)}`);
        console.log(`Has pending extensions: ${extensionData.some(e => e.status === 'pending')}`);
      } catch (err) {
        console.error("Error loading feedback, questions, and extension requests:", err);
        setError("Failed to load feedback and questions");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [presentationId, cardIndex]);

  // Set up subscriptions when presentationId changes
  useEffect(() => {
    if (!presentationId) return;
    
    // Clean up any existing subscriptions
    subscriptions.forEach(sub => sub.unsubscribe());

    // Set up new subscriptions
    const newSubscriptions: { unsubscribe: () => void }[] = [];

    // Subscribe to feedback
    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        console.log("REALTIME: Received feedback update:", newFeedback);
        // If cardIndex is specified, only add feedback for that card
        if (cardIndex !== undefined && newFeedback.card_index !== cardIndex) {
          return;
        }
        setFeedback((prev) => [newFeedback, ...prev]);
      },
      cardIndex
    );
    newSubscriptions.push(feedbackSubscription);

    // Subscribe to questions
    const questionSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        console.log("REALTIME: Received question update:", newQuestion);
        // If cardIndex is specified, only add questions for that card
        if (cardIndex !== undefined && newQuestion.card_index !== cardIndex) {
          return;
        }
        
        // Check if this is a new question or an update to an existing one
        setQuestions((prev) => {
          const questionExists = prev.some(q => q.id === newQuestion.id);
          
          if (questionExists) {
            // Update existing question
            return prev.map(q => q.id === newQuestion.id ? newQuestion : q);
          } else {
            // Add new question and set the new questions flag
            setHasNewQuestions(true);
            return [newQuestion, ...prev];
          }
        });
      },
      cardIndex
    );
    newSubscriptions.push(questionSubscription);
    
    // Subscribe to extension requests
    const extensionSubscription = subscribeToExtensionRequests(
      presentationId,
      (newRequest) => {
        console.log("REALTIME: Received extension request update:", newRequest);
        
        // Handle the extension request
        setExtensionRequests(prev => {
          // Check if this is a new request or an update to an existing one
          const existingIndex = prev.findIndex(r => r.id === newRequest.id);
          
          if (existingIndex >= 0) {
            // Update existing request
            const updated = [...prev];
            updated[existingIndex] = newRequest;
            
            // If this was a pending request and now it's not, we might need to update the hasNewExtensionRequests flag
            if (prev[existingIndex].status === 'pending' && newRequest.status !== 'pending') {
              // Check if there are still any pending requests
              const stillHasPending = updated.some(r => r.status === 'pending' && r.id !== newRequest.id);
              if (!stillHasPending) {
                setHasNewExtensionRequests(false);
              }
            }
            
            return updated;
          } else {
            // New request - set the flag if it's pending
            if (newRequest.status === 'pending') {
              setHasNewExtensionRequests(true);
            }
            
            return [newRequest, ...prev];
          }
        });
      }
    );
    newSubscriptions.push(extensionSubscription);

    // Save the subscriptions for cleanup
    setSubscriptions(newSubscriptions);

    // Clean up subscriptions when component unmounts or presentationId changes
    return () => {
      console.log("Cleaning up subscriptions for presentationId:", presentationId);
      newSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [presentationId, cardIndex]);

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
      console.log("Approving extension request:", requestId);
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
        
        console.log("Extension request approved successfully");
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
      console.log("Rejecting extension request:", requestId);
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
        
        console.log("Extension request rejected successfully");
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

  // Build student feedback map for student view
  const studentFeedbackMap: Record<string, { feedback_type: string; timestamp: string }> = {};
  feedback.forEach(item => {
    // Only include feedback for current card if filtering
    if (cardIndex !== undefined && item.card_index !== cardIndex) return;
    
    studentFeedbackMap[item.student_name] = {
      feedback_type: item.feedback_type,
      timestamp: item.created_at
    };
  });

  return {
    feedback,
    questions,
    extensionRequests,
    feedbackCounts,
    newQuestionsCount,
    pendingExtensionCount,
    hasNewQuestions,
    hasNewExtensionRequests,
    loading,
    error,
    studentFeedbackMap,
    handleMarkAsAnswered,
    handleApproveExtension,
    handleRejectExtension,
    clearHasNewQuestions: () => setHasNewQuestions(false),
    clearHasNewExtensionRequests: () => setHasNewExtensionRequests(false)
  };
}