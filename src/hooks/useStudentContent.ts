import { useState, useEffect, useRef, useCallback } from 'react';
import { useFeedbackSubmission } from './useFeedbackSubmission';
import { useStudentSession } from './useStudentSession';
import { getStudentExtensionRequestStatus, submitExtensionRequest } from '../lib/supabase';

export function useStudentContent(sessionCode: string, studentName: string, avatarUrl: string) {
  // UI state for interaction
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [extensionRequested, setExtensionRequested] = useState(false);
  const [extensionPending, setExtensionPending] = useState(false);
  const [extensionApproved, setExtensionApproved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Use existing custom hooks for session data and feedback
  const { 
    presentation, 
    currentCard, 
    currentCardAttachments,
    messages, 
    newMessage,
    teacherName,
    lessonStarted,
    error: sessionError
  } = useStudentSession(sessionCode, studentName);
  
  const { 
    sendFeedback, 
    sendQuestion, 
    generateDifferentiated, 
    isSending, 
    generatingDifferentiated, 
    successMessage,
    currentFeedback,
    setCurrentCardIndex,
    error: feedbackError,
    clearError,
    clearSuccessMessage
  } = useFeedbackSubmission(presentation?.id, studentName);

  // Update current card index when it changes in the presentation
  useEffect(() => {
    if (presentation) {
      setCurrentCardIndex(presentation.current_card_index);
    }
  }, [presentation?.current_card_index, setCurrentCardIndex]);

  // Check for existing extension request
  useEffect(() => {
    const checkExtensionStatus = async () => {
      if (presentation?.id && currentCard && currentCard.extensionActivity && presentation.current_card_index !== undefined) {
        try {
          console.log("Checking extension request status for:", {
            presentationId: presentation.id,
            studentName,
            cardIndex: presentation.current_card_index
          });
          
          const status = await getStudentExtensionRequestStatus(
            presentation.id,
            studentName,
            presentation.current_card_index
          );
          
          console.log("Extension request status:", status);
          
          if (status === 'pending') {
            setExtensionRequested(true);
            setExtensionPending(true);
            setExtensionApproved(false);
          } else if (status === 'approved') {
            setExtensionRequested(true);
            setExtensionPending(false);
            setExtensionApproved(true);
          } else {
            // If no record found or status is rejected, reset states
            setExtensionRequested(false);
            setExtensionPending(false);
            setExtensionApproved(false);
          }
        } catch (error) {
          console.error('Error checking extension request status:', error);
        }
      }
    };
    
    checkExtensionStatus();
    
    // Set up polling for extension request status changes
    let intervalId: number;
    if (extensionRequested && extensionPending && presentation?.id && presentation.current_card_index !== undefined) {
      intervalId = window.setInterval(async () => {
        try {
          const status = await getStudentExtensionRequestStatus(
            presentation.id,
            studentName,
            presentation.current_card_index
          );
          
          if (status === 'approved') {
            setExtensionPending(false);
            setExtensionApproved(true);
          } else if (status === 'rejected') {
            setExtensionRequested(false);
            setExtensionPending(false);
            setExtensionApproved(false);
          }
        } catch (error) {
          console.error('Error polling extension request status:', error);
        }
      }, 5000);
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [currentCard, presentation?.id, presentation?.current_card_index, studentName, extensionRequested, extensionPending]);

  // Scroll to top when card changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Reset differentiated view when card changes
    setViewingDifferentiated(false);
  }, [presentation?.current_card_index]);

  // Reset message count when panel is opened
  useEffect(() => {
    if (showMessagePanel) {
      setNewMessageCount(0);
    }
  }, [showMessagePanel]);

  // Effect to update new message count and handle message display
  useEffect(() => {
    if (newMessage && !showMessagePanel) {
      setNewMessageCount(prev => prev + 1);
    }
  }, [newMessage, showMessagePanel]);

  const handleToggleDifferentiatedView = () => {
    setViewingDifferentiated(!viewingDifferentiated);
  };
  
  const handleGenerateDifferentiated = async () => {
    if (!currentCard || generatingDifferentiated) return false;
    
    try {
      // Create a differentiated version of the current card
      const differentiatedContent = await generateDifferentiated(
        currentCard.content,
        currentCard.type
      );
      
      // Update the card with differentiated content
      if (presentation && currentCard && differentiatedContent) {
        const updatedCards = [...presentation.cards];
        const cardIndex = presentation.current_card_index;
        
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          differentiatedContent
        };
        
        // Switch to differentiated view
        setViewingDifferentiated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error generating differentiated content:', error);
      return false;
    }
  };

  const handleExtensionRequest = useCallback(async () => {
    if (!presentation?.id || presentation.current_card_index === undefined) {
      console.error("Cannot request extension activity - missing presentation data");
      return;
    }
    
    setExtensionRequested(true);
    setExtensionPending(true);
    
    try {
      console.log("Submitting extension request:", {
        presentationId: presentation.id,
        studentName,
        cardIndex: presentation.current_card_index
      });
      
      const result = await submitExtensionRequest(
        presentation.id,
        studentName,
        presentation.current_card_index
      );
      
      if (!result) {
        throw new Error('Failed to submit extension request');
      }
      
      console.log("Extension request submitted successfully:", result);
    } catch (error) {
      console.error('Error requesting extension activity:', error);
      setExtensionRequested(false);
      setExtensionPending(false);
    }
  }, [presentation?.id, presentation?.current_card_index, studentName]);

  const toggleMessagePanel = () => {
    setShowMessagePanel(prev => !prev);
    if (!showMessagePanel) {
      setNewMessageCount(0);
    }
  };

  return {
    // From useStudentSession
    presentation,
    currentCard,
    currentCardAttachments,
    messages,
    teacherName,
    lessonStarted,
    sessionError,
    
    // From useFeedbackSubmission
    sendFeedback,
    sendQuestion,
    isSending,
    successMessage,
    currentFeedback,
    feedbackError,
    clearError,
    clearSuccessMessage,
    
    // Local state
    viewingDifferentiated,
    generatingDifferentiated,
    showMessagePanel,
    newMessageCount,
    contentRef,
    extensionRequested,
    extensionPending,
    extensionApproved,
    
    // Methods
    handleToggleDifferentiatedView,
    handleGenerateDifferentiated,
    handleExtensionRequest,
    toggleMessagePanel
  };
}