import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { ProcessedLesson, LessonCard, TeacherMessage } from './types';

// In a real application, use environment variables to secure these values
const supabaseUrl = 'https://luxanhwgynfazfrzapto.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eGFuaHdneW5mYXpmcnphcHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODk2OTQsImV4cCI6MjA2NDE2NTY5NH0.HvmUoelP99vPNAw_pPBLK004VDwfKESjYdeTTdfUVS4';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for our Supabase tables
export interface Session {
  id: string;
  code: string;
  created_at: string;
  teacher_name: string;
  active: boolean;
}

export interface Feedback {
  id: string;
  session_code: string;
  student_name: string;
  value: string;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_code: string;
  student_name: string;
  joined_at: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  processed_content: ProcessedLesson | null;
  created_at: string;
}

export interface LessonPresentation {
  id: string;
  lesson_id: string;
  session_code: string;
  session_id: string;
  current_card_index: number;
  cards: LessonCard[];
  active: boolean;
  created_at: string;
  realtime_enabled: boolean;
}

export const createLessonPresentation = async (
  lessonId: string,
  cards: LessonCard[],
  teacherName: string
): Promise<LessonPresentation | null> => {
  let code: string;
  
  try {
    // Validate cards structure
    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error('Invalid cards data');
    }

    // Validate each card has required properties
    const validCards = cards.map(card => {
      if (!card.id || !card.type || !card.title || !card.content) {
        throw new Error('Each card must have id, type, title, and content');
      }
      
      if (!['objective', 'material', 'section', 'activity', 'custom'].includes(card.type)) {
        throw new Error(`Invalid card type: ${card.type}`);
      }
      
      return {
        id: card.id,
        type: card.type,
        title: card.title,
        content: String(card.content),
        duration: card.duration || null,
        sectionId: typeof card.sectionId === 'string' ? card.sectionId : null,
        activityIndex: typeof card.activityIndex === 'number' ? card.activityIndex : null
      };
    });

    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // First create a session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        code,
        teacher_name: teacherName,
        active: true
      }])
      .select()
      .single();
    
    if (sessionError) throw sessionError;
    
    // Then create the presentation linked to the session
    const presentationData = {
      lesson_id: lessonId,
      session_code: code,
      session_id: session.id,
      cards: validCards, // Use validated cards
      current_card_index: 0,
      active: true
    };

    const { data, error } = await supabase
      .from('lesson_presentations')
      .insert([presentationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating lesson presentation:', err);
    // Clean up session if presentation creation fails
    if (code) {
      await supabase
        .from('sessions')
        .delete()
        .eq('code', code);
    }
    return null;
  }
};

export const getLessonPresentationByCode = async (
  code: string
): Promise<LessonPresentation | null> => {
  try {
    console.log('Student requesting presentation for code:', code);
    
    // First check if session is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single();

    if (sessionError || !session) {
      console.error('Session not found or inactive');
      return null;
    }

    console.log('Found active session:', JSON.stringify(session, null, 2));

    const { data, error } = await supabase
      .from('lesson_presentations')
      .select('*')
      .eq('session_code', code)
      .eq('active', true)
      .single();
    
    if (error || !data) {
      console.error('Error fetching presentation:', error);
      return null;
    }
    
    console.log('Retrieved presentation data for students:', JSON.stringify(data, null, 2));
    console.log('Presentation cards type:', typeof data.cards);
    console.log('Presentation cards is array:', Array.isArray(data.cards));
    if (Array.isArray(data.cards) && data.cards.length > 0) {
      console.log('First card:', JSON.stringify(data.cards[0], null, 2));
    }
    
    // No need to parse cards - Supabase automatically handles JSONB
    return data;
  } catch (err) {
    console.error('Error fetching lesson presentation:', err);
    return null;
  }
};

export const updateLessonPresentationCardIndex = async (
  presentationId: string,
  newIndex: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lesson_presentations')
      .update({ current_card_index: newIndex })
      .eq('id', presentationId);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating card index:', err);
    return false;
  }
};

export const endLessonPresentation = async (
  presentationId: string
): Promise<boolean> => {
  try {
    // Get the presentation first to get the session code
    const { data: presentation, error: fetchError } = await supabase
      .from('lesson_presentations')
      .select('session_code')
      .eq('id', presentationId)
      .single();

    if (fetchError) throw fetchError;

    // End both the presentation and its associated session
    const { error: presentationError } = await supabase
      .from('lesson_presentations')
      .update({ active: false })
      .eq('id', presentationId);

    if (presentationError) throw presentationError;

    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ active: false })
      .eq('code', presentation.session_code);
    
    if (sessionError) throw sessionError;

    return true;
  } catch (err) {
    console.error('Error ending presentation:', err);
    return false;
  }
};

export const subscribeToLessonPresentation = (
  code: string,
  callback: (payload: LessonPresentation) => void
) => {
  return supabase
    .channel('lesson_presentations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lesson_presentations',
        filter: `session_code=eq.${code}`,
      },
      (payload) => callback(payload.new as LessonPresentation)
    )
    .subscribe();
};

// Helper functions for sessions
export const createSession = async (teacherName: string): Promise<Session | null> => {
  // Generate a 6-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        { 
          code, 
          teacher_name: teacherName,
          active: true 
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception creating session:', err);
    return null;
  }
};

export const getSessionByCode = async (code: string): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select()
      .eq('code', code)
      .eq('active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No session found - this is not an error case
        return null;
      }
      console.error('Error fetching session:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception fetching session:', err);
    return null;
  }
};

export const endSession = async (code: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ active: false })
      .eq('code', code);
    
    if (error) {
      console.error('Error ending session:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception ending session:', err);
    return false;
  }
};

// Helper functions for session participants
export const addSessionParticipant = async (
  sessionCode: string,
  studentName: string
): Promise<SessionParticipant | null> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .insert([
        {
          session_code: sessionCode,
          student_name: studentName
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding session participant:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception adding session participant:', err);
    return null;
  }
};

export const getParticipantsForSession = async (sessionCode: string): Promise<SessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_code', sessionCode)
      .order('joined_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching session participants:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching session participants:', err);
    return [];
  }
};

export const subscribeToSessionParticipants = (
  sessionCode: string,
  callback: (payload: SessionParticipant) => void
) => {
  return supabase
    .channel('public:session_participants')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_participants',
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => callback(payload.new as SessionParticipant)
    )
    .subscribe();
};

// Helper functions for feedback
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

// Real-time teaching functions
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
    
    const { error } = await supabase
      .from('teaching_questions')
      .insert([{
        presentation_id: presentationId,
        student_name: studentName,
        question
      }]);
    
    if (error) {
      console.error('Database error submitting question:', error);
      throw error;
    }
    
    console.log('Question submitted successfully');
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

// Teacher messages functions
export const sendTeacherMessage = async (
  presentationId: string,
  teacherName: string,
  messageContent: string
): Promise<boolean> => {
  try {
    console.log('Sending teacher message:', {
      presentation_id: presentationId,
      teacher_name: teacherName,
      message_content: messageContent
    });
    
    const { error } = await supabase
      .from('teacher_messages')
      .insert([{
        presentation_id: presentationId,
        teacher_name: teacherName,
        message_content: messageContent
      }]);

    if (error) {
      console.error('Error inserting teacher message:', error);
      throw error;
    }
    
    console.log('Teacher message sent successfully');
    return true;
  } catch (err) {
    console.error('Error sending teacher message:', err);
    return false;
  }
};

export const getTeacherMessagesForPresentation = async (
  presentationId: string
): Promise<TeacherMessage[]> => {
  try {
    console.log('Fetching teacher messages for presentation:', presentationId);
    const { data, error } = await supabase
      .from('teacher_messages')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: true });  // Ascending for conversation flow
    
    if (error) {
      console.error('Error fetching teacher messages:', error);
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} teacher messages`);
    return data || [];
  } catch (err) {
    console.error('Exception fetching teacher messages:', err);
    return [];
  }
};

export const subscribeToTeacherMessages = (
  presentationId: string,
  callback: (message: TeacherMessage) => void
) => {
  console.log('Setting up subscription for teacher messages on presentation:', presentationId);
  
  try {
    // Create a unique channel ID to prevent conflicts
    const channelId = `teacher_messages_${presentationId}_${Math.random().toString(36).substring(2, 9)}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'teacher_messages',
          filter: `presentation_id=eq.${presentationId}`,
        },
        (payload) => {
          console.log('Received new teacher message via subscription:', payload.new);
          callback(payload.new as TeacherMessage);
        }
      )
      .subscribe((status) => {
        console.log(`Teacher messages subscription status (${channelId}):`, status);
      });
    
    return {
      unsubscribe: () => {
        console.log(`Unsubscribing from teacher messages channel ${channelId}`);
        channel.unsubscribe();
      }
    };
  } catch (error) {
    console.error('Error setting up teacher messages subscription:', error);
    // Return a dummy subscription with unsubscribe method to prevent crashes
    return {
      unsubscribe: () => console.log('Dummy unsubscribe called')
    };
  }
};