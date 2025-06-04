import { useState, useEffect } from 'react';
import { 
  submitTeachingFeedback, 
  submitTeachingQuestion,
  getStudentFeedbackForCard
} from '../lib/supabase';
import { generateDifferentiatedContent } from '../lib/aiService';

export function useFeedbackSubmission(presentationId: string | undefined, studentName: string) {
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number | undefined>(undefined);

  // Helper to clear success message after a timeout
  const showSuccessAndClear = (message: string, duration = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, duration);
  };

  // Update current card index when it changes in the presentation
  useEffect(() => {
    if (presentationId && currentCardIndex !== undefined) {
      // Check if student has already submitted feedback for this card
      const checkExistingFeedback = async () => {
        const existingFeedback = await getStudentFeedbackForCard(
          presentationId,
          studentName,
          currentCardIndex
        );
        
        if (existingFeedback) {
          setCurrentFeedback(existingFeedback.feedback_type);
        } else {
          setCurrentFeedback(null);
        }
      };
      
      checkExistingFeedback();
    }
  }, [presentationId, studentName, currentCardIndex]);

  // Send feedback (understand, confused, slower)
  const sendFeedback = async (type: string) => {
    if (!presentationId || isSending || currentCardIndex === undefined) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const success = await submitTeachingFeedback(
        presentationId,
        studentName,
        type,
        currentCardIndex
      );
      
      if (success) {
        setCurrentFeedback(type); // Update local state to reflect submission
        showSuccessAndClear('Feedback sent successfully');
      } else {
        setError('Failed to send feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('An error occurred while sending feedback');
    } finally {
      setIsSending(false);
    }
  };

  // Send a question
  const sendQuestion = async (question: string): Promise<boolean> => {
    if (!presentationId || !question.trim() || isSending || currentCardIndex === undefined) return false;
    
    setIsSending(true);
    setError(null);
    
    try {
      const success = await submitTeachingQuestion(
        presentationId,
        studentName,
        question.trim(),
        currentCardIndex
      );
      
      if (success) {
        showSuccessAndClear('Question sent successfully');
        return true;
      } else {
        setError('Failed to send question');
        return false;
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('An error occurred while sending your question');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // Generate differentiated content
  const generateDifferentiated = async (content: string, type: string) => {
    setGeneratingDifferentiated(true);
    setError(null);
    
    try {
      const differentiatedContent = await generateDifferentiatedContent(
        content,
        type,
        "elementary" // Default level for simplification
      );
      
      showSuccessAndClear('Simplified version created');
      
      return differentiatedContent;
    } catch (err) {
      console.error('Error generating differentiated content:', err);
      setError('Failed to create simplified version');
      return null;
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  return {
    sendFeedback,
    sendQuestion,
    generateDifferentiated,
    isSending,
    generatingDifferentiated,
    successMessage,
    error,
    currentFeedback,
    setCurrentCardIndex,
    clearError: () => setError(null),
    clearSuccessMessage: () => setSuccessMessage(null)
  };
}