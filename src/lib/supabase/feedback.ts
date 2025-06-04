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
  cardIndex?: number,
  content?: string
): Promise<boolean> => {
  try {
    // Check if the student has already submitted feedback for this card
    if (cardIndex !== undefined) {
      const { data: existingFeedback, error: checkError } = await supabase
        .from('teaching_feedback')
        .select('id')
        .eq('presentation_id', presentationId)
        .eq('student_name', studentName)
        .eq('card_index', cardIndex)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing feedback:', checkError);
      }
      
      // If student already provided feedback for this card, update instead of insert
      if (existingFeedback) {
        const { error: updateError } = await supabase
          .from('teaching_feedback')
          .update({ 
            feedback_type: feedbackType,
            content,
            created_at: new Date().toISOString() 
          })
          .eq('id', existingFeedback.id);
          
        if (updateError) {
          console.error('Error updating existing feedback:', updateError);
          return false;
        }
        
        return true;
      }
    }
    
    // No existing feedback found or card index not provided, insert new feedback
    const { error } = await supabase
      .from('teaching_feedback')
      .insert([{
        presentation_id: presentationId,
        student_name: studentName,
        feedback_type: feedbackType,
        card_index: cardIndex,
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
  question: string,
  cardIndex?: number
): Promise<boolean> => {
  try {
    console.log('Submitting question:', {
      presentation_id: presentationId,
      student_name: studentName,
      question: question,
      card_index: cardIndex
    });
    
    const { data, error } = await supabase
      .from('teaching_questions')
      .insert([{
        presentation_id: presentationId,
        student_name: studentName,
        question,
        card_index: cardIndex
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

export const getStudentFeedbackForCard = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId)
      .eq('student_name', studentName)
      .eq('card_index', cardIndex)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching student feedback for card:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception fetching student feedback for card:', err);
    return null;
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
  presentationId: string,
  cardIndex?: number
): Promise<any[]> => {
  try {
    let query = supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId);
      
    // Filter by card index if provided
    if (cardIndex !== undefined) {
      query = query.eq('card_index', cardIndex);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
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
  callback: (feedback: any) => void,
  cardIndex?: number
) => {
  // Create a filter including the card index if provided
  const filter = cardIndex !== undefined 
    ? `presentation_id=eq.${presentationId}&card_index=eq.${cardIndex}`
    : `presentation_id=eq.${presentationId}`;
    
  return supabase
    .channel('teaching_feedback')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'teaching_feedback',
        filter,
      },
      (payload) => callback(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'teaching_feedback',
        filter,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void,
  cardIndex?: number
) => {
  // Create a filter including the card index if provided
  const filter = cardIndex !== undefined 
    ? `presentation_id=eq.${presentationId}&card_index=eq.${cardIndex}`
    : `presentation_id=eq.${presentationId}`;
    
  return supabase
    .channel('teaching_questions')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'teaching_questions',
        filter,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

// Get feedback stats grouped by student and feedback type for a specific card
export const getCardFeedbackByStudent = async (
  presentationId: string,
  cardIndex: number
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId)
      .eq('card_index', cardIndex);
      
    if (error) {
      console.error('Error fetching card feedback by student:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching card feedback by student:', err);
    return [];
  }
};