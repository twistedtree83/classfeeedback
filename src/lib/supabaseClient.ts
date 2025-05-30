import { createClient } from '@supabase/supabase-js';
import type { ProcessedLesson } from './types';

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
  value: string; // '👍', '😕', '❓', etc.
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
  pdf_path: string;
  processed_content: ProcessedLesson | null;
  created_at: string;
}

export const uploadLessonPlan = async (
  file: File,
  title: string
): Promise<LessonPlan | null> => {
  try {
    // Upload PDF to storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lesson_plans')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    // Create database record
    const { data: lessonPlan, error: dbError } = await supabase
      .from('lesson_plans')
      .insert([
        {
          title,
          pdf_path: uploadData.path,
          processed_content: null // Will be updated after processing
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error creating lesson plan record:', dbError);
      return null;
    }

    return lessonPlan;
  } catch (err) {
    console.error('Exception in uploadLessonPlan:', err);
    return null;
  }
};

export const getLessonPlan = async (id: string): Promise<LessonPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lesson plan:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in getLessonPlan:', err);
    return null;
  }
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
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .single();
    
    if (error) {
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

// Function to subscribe to real-time feedback for a session
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