import { useState } from 'react';
import { 
  submitTeachingFeedback, 
  submitTeachingQuestion
} from '../lib/supabase';
import { generateDifferentiatedContent } from '../lib/aiService';

export function useFeedbackSubmission(presentationId: string | undefined, studentName: string) {
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);

  // Helper to clear success message after a timeout
  const showSuccessAndClear = (message: string, duration = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, duration);
  };

  // Send feedback (understand, confused, slower)
  const sendFeedback = async (type: string) => {
    if (!presentationId || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const success = await submitTeachingFeedback(
        presentationId,
        studentName,
        type
      );
      
      if (success) {
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
  const sendQuestion = async (question: string) => {
    if (!presentationId || !question.trim() || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const success = await submitTeachingQuestion(
        presentationId,
        studentName,
        question.trim()
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
    clearError: () => setError(null),
    clearSuccessMessage: () => setSuccessMessage(null)
  };
}