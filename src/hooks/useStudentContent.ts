import { useState, useEffect, useRef } from 'react';
import { useFeedbackSubmission } from './useFeedbackSubmission';
import { useStudentSession } from './useStudentSession';

export function useStudentContent(sessionCode: string, studentName: string, avatarUrl: string) {
  // UI state for interaction
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
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
    
    // Methods
    handleToggleDifferentiatedView,
    handleGenerateDifferentiated,
    toggleMessagePanel
  };
}