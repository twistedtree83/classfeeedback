import { useState, useEffect } from 'react';
import {
  getTeachingFeedbackForPresentation,
  getTeachingQuestionsForPresentation,
  subscribeToTeachingFeedback,
  subscribeToTeachingQuestions,
  markQuestionAsAnswered
} from '../lib/supabase';

export function useTeacherFeedbackAndQuestions(presentationId: string | undefined) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial feedback and questions
  useEffect(() => {
    if (!presentationId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [feedbackData, questionsData] = await Promise.all([
          getTeachingFeedbackForPresentation(presentationId),
          getTeachingQuestionsForPresentation(presentationId)
        ]);
        
        setFeedback(feedbackData);
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error loading feedback and questions:', err);
        setError('Failed to load feedback and questions');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [presentationId]);

  // Subscribe to real-time feedback
  useEffect(() => {
    if (!presentationId) return;
    
    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        setFeedback(prev => [newFeedback, ...prev]);
      }
    );
    
    return () => {
      feedbackSubscription.unsubscribe();
    };
  }, [presentationId]);

  // Subscribe to real-time questions
  useEffect(() => {
    if (!presentationId) return;
    
    const questionSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        setQuestions(prev => [newQuestion, ...prev]);
        setHasNewQuestions(true);
      }
    );
    
    return () => {
      questionSubscription.unsubscribe();
    };
  }, [presentationId]);

  const handleMarkAsAnswered = async (questionId: string) => {
    try {
      const success = await markQuestionAsAnswered(questionId);
      if (success) {
        // Update local state
        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q.id === questionId ? { ...q, answered: true } : q
          )
        );
        // Check if there are still new questions
        const newQuestionsExist = questions.some(q => !q.answered && q.id !== questionId);
        if (!newQuestionsExist) {
          setHasNewQuestions(false);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking question as answered:', error);
      return false;
    }
  };

  // Group feedback by type for statistics
  const feedbackCounts = {
    understand: feedback.filter(f => f.feedback_type === 'understand').length,
    confused: feedback.filter(f => f.feedback_type === 'confused').length,
    slower: feedback.filter(f => f.feedback_type === 'slower').length,
    total: feedback.length
  };

  return {
    feedback,
    questions,
    feedbackCounts,
    hasNewQuestions,
    loading,
    error,
    handleMarkAsAnswered,
    clearHasNewQuestions: () => setHasNewQuestions(false)
  };
}