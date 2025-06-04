import { supabase } from './client';
import type { Feedback } from './types';

export const submitFeedback = async (
  sessionCode: string, 
  studentName: string, 
  value: string
): Promise<Feedback | null> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        { 
          session_code: sessionCode,
          student_name: studentName,
          value 
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting feedback:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception submitting feedback:', err);
    return null;
  }
};

export const getFeedbackForSession = async (sessionCode: string): Promise<Feedback[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('session_code', sessionCode)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching feedback:', err);
    return [];
  }
};

export const subscribeToSessionFeedback = (
  sessionCode: string,
  callback: (payload: Feedback) => void
) => {
  return supabase
    .channel('public:feedback')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'feedback',
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => callback(payload.new as Feedback)
    )
    .subscribe();
};

// Teaching feedback
export const submitTeachingFeedback = async (
  presentationId: string,
  studentName: string,
  feedbackType: string,
  content?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('teaching_feedback')
      .insert([{
        presentation_id: presentationId,
        student_name: studentName,
        feedback_type: feedbackType,
        content
      }]);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error submitting teaching feedback:', err);
    return false;
  }
};

export const submitTeachingQuestion = async (
  presentationId: string,
  studentName: string,
  question: string
): Promise<boolean> => {
  try {
    console.log('Submitting question:', {
      presentation_id: presentationId,
      student_name: studentName,
      question: question
    });
    
    const { data, error } = await supabase
      .from('teaching_questions')
      .insert([{
        presentation_id: presentationId,
        student_name: studentName,
        question
      }])
      .select();
    
    if (error) {
      console.error('Database error submitting question:', error);
      throw error;
    }
    
    console.log('Question submitted successfully, response:', data);
    return true;
  } catch (err) {
    console.error('Error submitting question:', err);
    return false;
  }
};

export const markQuestionAsAnswered = async (
  questionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('teaching_questions')
      .update({ answered: true })
      .eq('id', questionId);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking question as answered:', err);
    return false;
  }
};

export const getTeachingQuestionsForPresentation = async (
  presentationId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('teaching_questions')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching teaching questions:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching teaching questions:', err);
    return [];
  }
};

export const getTeachingFeedbackForPresentation = async (
  presentationId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching teaching feedback:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching teaching feedback:', err);
    return [];
  }
};

export const subscribeToTeachingFeedback = (
  presentationId: string,
  callback: (feedback: any) => void
) => {
  return supabase
    .channel('teaching_feedback')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'teaching_feedback',
        filter: `presentation_id=eq.${presentationId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void
) => {
  return supabase
    .channel('teaching_questions')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'teaching_questions',
        filter: `presentation_id=eq.${presentationId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};