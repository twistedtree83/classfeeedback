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
  const [subscriptions, setSubscriptions] = useState<Array<{unsubscribe: () => void}>>([]);

  // Load initial feedback, questions, and extension requests
  useEffect(() => {
    if (!presentationId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load all data in parallel
        const [feedbackData, questionsData, extensionData] = await Promise.all([
          getTeachingFeedbackForPresentation(presentationId, cardIndex),
          getTeachingQuestionsForPresentation(presentationId),
          getExtensionRequestsForPresentation(presentationId)
        ]);

        console.log('[Teacher] Initial data loaded:', {
          feedbackCount: feedbackData.length,
          questionsCount: questionsData.length,
          extensionsCount: extensionData.length
        });

        setFeedback(feedbackData);
        setQuestions(questionsData);
        setExtensionRequests(extensionData);
        
        // Check if there are new questions or extension requests
        setHasNewQuestions(questionsData.some(q => !q.answered));
        setHasNewExtensionRequests(extensionData.some(e => e.status === 'pending'));
      } catch (err) {
        console.error("[Teacher] Error loading initial data:", err);
        setError("Failed to load feedback and questions");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Clean up previous subscriptions
    return () => {
      console.log('[Teacher] Cleaning up previous subscriptions');
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [presentationId, cardIndex]);

  // Set up subscriptions for realtime updates
  useEffect(() => {
    if (!presentationId) return;

    console.log('[Teacher] Setting up realtime subscriptions');
    const newSubscriptions = [];

    // Feedback subscription
    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        console.log('[Teacher] New feedback received:', newFeedback);
        
        // If cardIndex is specified, only add feedback for that card
        if (cardIndex !== undefined && newFeedback.card_index !== cardIndex) {
          return;
        }
        
        setFeedback(prev => {
          // Check if this is an update to existing feedback
          const existingIndex = prev.findIndex(f => 
            f.student_name === newFeedback.student_name && 
            f.card_index === newFeedback.card_index
          );
          
          if (existingIndex >= 0) {
            // Update existing feedback
            const updated = [...prev];
            updated[existingIndex] = newFeedback;
            return updated;
          }
          
          // Add new feedback
          return [newFeedback, ...prev];
        });
      }
    );
    newSubscriptions.push(feedbackSubscription);

    // Questions subscription
    const questionsSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        console.log('[Teacher] New question received:', newQuestion);
        
        setQuestions(prev => {
          // Check if this is a new question
          const questionExists = prev.some(q => q.id === newQuestion.id);
          
          if (!questionExists) {
            // It's a new question, set the flag for notification
            setHasNewQuestions(true);
            // Add to the list
            return [newQuestion, ...prev];
          } else {
            // Update the existing question
            return prev.map(q => q.id === newQuestion.id ? newQuestion : q);
          }
        });
      }
    );
    newSubscriptions.push(questionsSubscription);
    
    // Extension requests subscription
    const extensionSubscription = subscribeToExtensionRequests(
      presentationId,
      (newRequest) => {
        console.log('[Teacher] Extension request received:', newRequest);
        
        setExtensionRequests(prev => {
          // Check if this is an update to an existing request
          const existingIndex = prev.findIndex(r => r.id === newRequest.id);
          
          if (existingIndex >= 0) {
            // Update existing request
            const updated = [...prev];
            updated[existingIndex] = newRequest;
            return updated;
          } else {
            // It's a new request
            if (newRequest.status === 'pending') {
              setHasNewExtensionRequests(true);
            }
            return [newRequest, ...prev];
          }
        });
      }
    );
    newSubscriptions.push(extensionSubscription);

    // Update subscriptions state
    setSubscriptions(newSubscriptions);
    
    // Clean up on unmount or when dependencies change
    return () => {
      console.log('[Teacher] Cleaning up realtime subscriptions');
      newSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [presentationId, cardIndex]);

  // Handler for marking questions as answered
  const handleMarkAsAnswered = async (questionId: string) => {
    try {
      console.log('[Teacher] Marking question as answered:', questionId);
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
      console.error("[Teacher] Error marking question as answered:", error);
      return false;
    }
  };
  
  // Handler for approving extension requests
  const handleApproveExtension = async (requestId: string) => {
    try {
      console.log("[Teacher] Approving extension request:", requestId);
      const success = await approveExtensionRequest(requestId);
      
      if (success) {
        console.log("[Teacher] Extension request approved successfully");
        
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
      console.error('[Teacher] Error approving extension request:', error);
      return false;
    }
  };
  
  // Handler for rejecting extension requests
  const handleRejectExtension = async (requestId: string) => {
    try {
      console.log("[Teacher] Rejecting extension request:", requestId);
      const success = await rejectExtensionRequest(requestId);
      
      if (success) {
        console.log("[Teacher] Extension request rejected successfully");
        
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
      console.error('[Teacher] Error rejecting extension request:', error);
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
  
  // Get pending extension requests for the current card
  const getCurrentCardPendingExtensions = () => {
    if (cardIndex === undefined) return [];
    
    return extensionRequests.filter(req => 
      req.status === 'pending' && req.card_index === cardIndex
    );
  };
  
  // Map student feedback for the current card
  const studentFeedbackMap = feedback.reduce((map, item) => {
    // Only include feedback for the current card if filtering is enabled
    if (cardIndex !== undefined && item.card_index !== cardIndex) {
      return map;
    }
    
    // Add or update the student's feedback
    map[item.student_name] = {
      feedback_type: item.feedback_type,
      timestamp: item.created_at
    };
    
    return map;
  }, {});

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
    handleMarkAsAnswered,
    handleApproveExtension,
    handleRejectExtension,
    clearHasNewQuestions: () => setHasNewQuestions(false),
    clearHasNewExtensionRequests: () => setHasNewExtensionRequests(false),
    pendingExtensionRequests: getCurrentCardPendingExtensions(),
    studentFeedbackMap
  };
}