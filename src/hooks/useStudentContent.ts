import { useState, useEffect, useRef, useCallback } from 'react';
import { useFeedbackSubmission } from './useFeedbackSubmission';
import { useStudentSession } from './useStudentSession';
import { 
  getStudentExtensionRequestStatus, 
  submitExtensionRequest, 
  checkStudentRemedialStatus 
} from '../lib/supabase';

export function useStudentContent(sessionCode: string, studentName: string, avatarUrl: string) {
  // UI state for interaction
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [viewingRemedial, setViewingRemedial] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [extensionRequested, setExtensionRequested] = useState(false);
  const [extensionPending, setExtensionPending] = useState(false);
  const [extensionApproved, setExtensionApproved] = useState(false);
  const [hasExtensionActivity, setHasExtensionActivity] = useState(false);
  const [hasRemedialAssignment, setHasRemedialAssignment] = useState(false);
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

  // Check for existing extension request and set up polling
  useEffect(() => {
    const checkExtensionStatus = async () => {
      if (presentation?.id && currentCard && presentation.current_card_index !== undefined) {
        try {
          console.log("Checking extension request status:", {
            presentationId: presentation.id,
            studentName,
            cardIndex: presentation.current_card_index
          });
          
          const status = await getStudentExtensionRequestStatus(
            presentation.id,
            studentName,
            presentation.current_card_index
          );
          
          console.log("Extension request status received:", status);
          
          if (status === 'pending') {
            setExtensionRequested(true);
            setExtensionPending(true);
            setExtensionApproved(false);
          } else if (status === 'approved') {
            setExtensionRequested(true);
            setExtensionPending(false);
            setExtensionApproved(true);
          } else if (status === 'rejected') {
            setExtensionRequested(false);
            setExtensionPending(false);
            setExtensionApproved(false);
          }
        } catch (error) {
          console.error('Error checking extension request status:', error);
        }
      }
    };
    
    // Initial check
    checkExtensionStatus();
    
    // Set up polling for regular updates
    const pollInterval = setInterval(checkExtensionStatus, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [presentation?.id, presentation?.current_card_index, currentCard, studentName]);

  // Update hasExtensionActivity when card changes
  useEffect(() => {
    if (currentCard) {
      const hasExtension = !!currentCard.extensionActivity;
      console.log(`Current card has extension: ${hasExtension}`);
      setHasExtensionActivity(hasExtension);
      
      // Reset extension status flags when changing cards only if no existing status
      getStudentExtensionRequestStatus(
        presentation?.id || '',
        studentName,
        presentation?.current_card_index || 0
      ).then(status => {
        if (!status) {
          setExtensionRequested(false);
          setExtensionPending(false);
          setExtensionApproved(false);
        }
      }).catch(err => {
        console.error("Error checking initial extension status:", err);
      });
    } else {
      console.log("No current card");
      setHasExtensionActivity(false);
    }
  }, [currentCard, presentation?.id, presentation?.current_card_index, studentName]);

  // Check if student has been assigned remedial content for this card
  useEffect(() => {
    if (!presentation?.id || !studentName || !currentCard) return;
    
    const checkRemedialAssignment = async () => {
      try {
        console.log("Checking remedial assignment for:", {
          presentationId: presentation.id,
          studentName,
          cardId: currentCard.id
        });
        
        // Check if student has remedial assignment for this card
        const cardSpecificAssignment = await checkStudentRemedialStatus(
          presentation.id,
          studentName,
          currentCard.id
        );
        
        // Check if student has general remedial assignment (all cards)
        const generalAssignment = await checkStudentRemedialStatus(
          presentation.id,
          studentName
        );
        
        const hasAssignment = cardSpecificAssignment || generalAssignment;
        console.log("Student remedial assignment status:", hasAssignment);
        
        setHasRemedialAssignment(hasAssignment);
        
        // If student has remedial assignment and remedial content is available, 
        // automatically show the remedial version
        if (hasAssignment && currentCard.remedialActivity && currentCard.isRemedialEnabled) {
          setViewingRemedial(true);
          // Turn off differentiated view if it's active
          if (viewingDifferentiated) {
            setViewingDifferentiated(false);
          }
        }
      } catch (error) {
        console.error('Error checking remedial assignment:', error);
      }
    };
    
    checkRemedialAssignment();
  }, [currentCard, presentation?.id, studentName, viewingDifferentiated]);

  // Scroll to top when card changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Reset differentiated view when card changes
    setViewingDifferentiated(false);
    setViewingRemedial(false);
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

  // Set up polling for extension request status
  useEffect(() => {
    if (!extensionRequested || !extensionPending || !presentation?.id) return;
    
    console.log("Starting extension request status polling");
    
    const checkInterval = setInterval(async () => {
      try {
        console.log("Polling extension request status");
        const status = await getStudentExtensionRequestStatus(
          presentation.id,
          studentName,
          presentation.current_card_index
        );
        
        console.log("Polled extension status:", status);
        
        if (status === 'approved') {
          console.log("Extension request approved! Updating UI...");
          setExtensionPending(false);
          setExtensionApproved(true);
          clearInterval(checkInterval);
        } else if (status === 'rejected') {
          console.log("Extension request rejected");
          setExtensionRequested(false);
          setExtensionPending(false);
          setExtensionApproved(false);
          clearInterval(checkInterval);
        }
      } catch (error) {
        console.error('Error checking extension status:', error);
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(checkInterval);
  }, [extensionRequested, extensionPending, presentation?.id, studentName, presentation?.current_card_index]);

  const handleToggleDifferentiatedView = () => {
    if (viewingRemedial) {
      // Turn off remedial view if turning on differentiated
      setViewingRemedial(false);
    }
    setViewingDifferentiated(!viewingDifferentiated);
  };
  
  const handleToggleRemedialView = () => {
    if (viewingDifferentiated) {
      // Turn off differentiated view if turning on remedial
      setViewingDifferentiated(false);
    }
    setViewingRemedial(!viewingRemedial);
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

  const handleExtensionRequest = async () => {
    if (!presentation?.id || presentation.current_card_index === undefined) return;
    
    setExtensionRequested(true);
    setExtensionPending(true);
    
    try {
      console.log("Requesting extension activity:", {
        presentationId: presentation.id,
        studentName,
        cardIndex: presentation.current_card_index
      });
      
      // Submit the extension request to the database
      const result = await submitExtensionRequest(
        presentation.id,
        studentName,
        presentation.current_card_index
      );
      
      console.log("Extension request result:", result);
      
      if (!result) {
        throw new Error('Failed to submit extension request');
      }
      
      // Start polling for approval status
    } catch (error) {
      console.error('Error requesting extension activity:', error);
      setExtensionRequested(false);
      setExtensionPending(false);
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
    viewingRemedial,
    generatingDifferentiated,
    showMessagePanel,
    newMessageCount,
    contentRef,
    extensionRequested,
    extensionPending,
    extensionApproved,
    hasExtensionActivity,
    hasRemedialAssignment,
    
    // Methods
    handleToggleDifferentiatedView,
    handleToggleRemedialView,
    handleGenerateDifferentiated,
    handleExtensionRequest,
    toggleMessagePanel
  };
}