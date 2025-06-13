import { supabase } from './client';
import type { Database } from './types';

type FeedbackRow = Database['public']['Tables']['feedback']['Row'];
type TeachingFeedbackRow = Database['public']['Tables']['teaching_feedback']['Row'];

// Get feedback for a specific session
export const getFeedbackForSession = async (sessionCode: string): Promise<FeedbackRow[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('session_code', sessionCode)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback for session:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching feedback for session:', err);
    return [];
  }
};

// Submit feedback to the feedback table
export const submitFeedback = async (
  sessionCode: string,
  studentName: string,
  value: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('feedback')
      .insert({
        session_code: sessionCode,
        student_name: studentName,
        value: value
      });

    if (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception submitting feedback:', err);
    return false;
  }
};

// Subscribe to real-time feedback updates for a session
export const subscribeToSessionFeedback = (
  sessionCode: string,
  callback: (feedback: FeedbackRow[]) => void
) => {
  const subscription = supabase
    .channel(`feedback_${sessionCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feedback',
        filter: `session_code=eq.${sessionCode}`
      },
      async () => {
        // Fetch updated feedback when changes occur
        const feedback = await getFeedbackForSession(sessionCode);
        callback(feedback);
      }
    )
    .subscribe();

  return subscription;
};

// Submit teaching feedback
export const submitTeachingFeedback = async (
  presentationId: string,
  studentName: string,
  feedbackType: string,
  content?: string,
  cardIndex?: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('teaching_feedback')
      .insert({
        presentation_id: presentationId,
        student_name: studentName,
        feedback_type: feedbackType,
        content: content,
        card_index: cardIndex
      });

    if (error) {
      console.error('Error submitting teaching feedback:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception submitting teaching feedback:', err);
    return false;
  }
};

// Get teaching feedback for a presentation
export const getTeachingFeedbackForPresentation = async (
  presentationId: string
): Promise<TeachingFeedbackRow[]> => {
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

// Subscribe to teaching feedback updates
export const subscribeToTeachingFeedback = (
  presentationId: string,
  callback: (feedback: TeachingFeedbackRow[]) => void
) => {
  const subscription = supabase
    .channel(`teaching_feedback_${presentationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teaching_feedback',
        filter: `presentation_id=eq.${presentationId}`
      },
      async () => {
        // Fetch updated feedback when changes occur
        const feedback = await getTeachingFeedbackForPresentation(presentationId);
        callback(feedback);
      }
    )
    .subscribe();

  return subscription;
};

// Get feedback for a specific card by student
export const getCardFeedbackByStudent = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<TeachingFeedbackRow[]> => {
  try {
    const { data, error } = await supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId)
      .eq('student_name', studentName)
      .eq('card_index', cardIndex)
      .order('created_at', { ascending: false });

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

// Fix the error in getStudentFeedbackForCard function:
export const getStudentFeedbackForCard = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<any | null> => {
  try {
    // Build query dynamically to handle missing card_index column
    let query = supabase
      .from("teaching_feedback")
      .select("*")
      .eq("presentation_id", presentationId)
      .eq("student_name", studentName);

    // Only add card_index filter if the column exists (this will fail gracefully if not)
    try {
      query = query.eq("card_index", cardIndex);
    } catch (columnError) {
      console.warn("card_index column not found, fetching without card filter");
    }

    // Use maybeSingle() instead of single() to prevent 406 errors when no records are found
    const { data, error } = await query.maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching student feedback:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception fetching student feedback:", err);
    return null;
  }
};