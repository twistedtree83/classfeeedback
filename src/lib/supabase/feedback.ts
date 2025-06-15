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
  callback: (feedback: FeedbackRow) => void
) => {
  const channelName = `feedback_${sessionCode}`;
  console.log(`Setting up feedback subscription on channel: ${channelName}`);
  
  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'feedback',
        filter: `session_code=eq.${sessionCode}`
      },
      (payload) => {
        console.log("New feedback received:", payload);
        callback(payload.new as FeedbackRow);
      }
    )
    .subscribe((status) => {
      console.log(`Feedback subscription status: ${status}`);
    });

  return subscription;
};

// Submit teaching feedback
export const submitTeachingFeedback = async (
  presentationId: string,
  studentName: string,
  feedbackType: string,
  cardIndex?: number,
  content?: string
): Promise<boolean> => {
  try {
    console.log('Submitting teaching feedback:', {
      presentation_id: presentationId,
      student_name: studentName,
      feedback_type: feedbackType,
      content: content,
      card_index: cardIndex
    });
    
    // Build the insert object
    const insertData = {
      presentation_id: presentationId,
      student_name: studentName,
      feedback_type: feedbackType,
      content: content,
      card_index: cardIndex !== undefined ? cardIndex : null
    };
    
    // Insert data without using ON CONFLICT, just a simple insert
    const { error } = await supabase
      .from('teaching_feedback')
      .insert(insertData);
    
    if (error) {
      console.error('Error submitting teaching feedback:', error);
      return false;
    }

    console.log('Teaching feedback submitted successfully');
    return true;
  } catch (err) {
    console.error('Exception submitting teaching feedback:', err);
    return false;
  }
};

// Get teaching feedback for a presentation
export const getTeachingFeedbackForPresentation = async (
  presentationId: string,
  cardIndex?: number
): Promise<TeachingFeedbackRow[]> => {
  try {
    let query = supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId);
    
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

// Subscribe to teaching feedback updates - Completely revised implementation
export const subscribeToTeachingFeedback = (
  presentationId: string,
  callback: (feedback: TeachingFeedbackRow) => void,
  cardIndex?: number
) => {
  // Generate a unique channel name to avoid conflicts
  const timestamp = Date.now();
  const channelName = `teaching_feedback_${presentationId}_${timestamp}`;
  
  console.log(`[Feedback] Setting up subscription on channel: ${channelName}`);
  console.log(`[Feedback] For presentationId: ${presentationId}, cardIndex: ${cardIndex}`);
  
  const channel = supabase.channel(channelName);
  
  // First, listen for inserts with just the presentation_id filter
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'teaching_feedback',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[Feedback] Received INSERT event:', payload);
      
      // If cardIndex is specified, check if it matches
      if (cardIndex !== undefined) {
        if (payload.new && payload.new.card_index === cardIndex) {
          callback(payload.new as TeachingFeedbackRow);
        }
      } else {
        if (payload.new) {
          callback(payload.new as TeachingFeedbackRow);
        }
      }
    }
  );
  
  // Then listen for updates
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'teaching_feedback',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[Feedback] Received UPDATE event:', payload);
      
      // If cardIndex is specified, check if it matches
      if (cardIndex !== undefined) {
        if (payload.new && payload.new.card_index === cardIndex) {
          callback(payload.new as TeachingFeedbackRow);
        }
      } else {
        if (payload.new) {
          callback(payload.new as TeachingFeedbackRow);
        }
      }
    }
  );
  
  // Subscribe and log the result
  const subscription = channel.subscribe((status, err) => {
    console.log(`[Feedback] Subscription status: ${status}`);
    if (err) {
      console.error('[Feedback] Subscription error:', err);
    } else {
      console.log('[Feedback] Subscription successfully established');
    }
  });
  
  return { unsubscribe: () => subscription.unsubscribe() };
};

// Get feedback for a specific card by student name
export const getCardFeedbackByStudent = async (
  presentationId: string,
  cardIndex?: number
): Promise<TeachingFeedbackRow[]> => {
  try {
    let query = supabase
      .from('teaching_feedback')
      .select('*')
      .eq('presentation_id', presentationId);
    
    // Only add card_index filter if cardIndex is provided and is a valid number
    if (cardIndex !== undefined) {
      query = query.eq('card_index', cardIndex);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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

// Get student feedback for a specific card
export const getStudentFeedbackForCard = async (
  presentationId: string,
  studentName: string,
  cardIndex?: number
): Promise<any | null> => {
  try {
    console.log('Getting student feedback for card:', {
      presentation_id: presentationId,
      student_name: studentName,
      card_index: cardIndex
    });
    
    let query = supabase
      .from("teaching_feedback")
      .select("*")
      .eq("presentation_id", presentationId)
      .eq("student_name", studentName);

    // Only add card_index filter if cardIndex is provided and is a valid number
    if (cardIndex !== undefined) {
      query = query.eq("card_index", cardIndex);
    }

    // Use maybeSingle() instead of single() to prevent 406 errors when no records are found
    const { data, error } = await query.maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching student feedback:", error);
      return null;
    }

    console.log('Student feedback found:', data);
    return data;
  } catch (err) {
    console.error("Exception fetching student feedback:", err);
    return null;
  }
};