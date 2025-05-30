import { createClient } from '@supabase/supabase-js';

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

// Helper functions for sessions
export const createSession = async (teacherName: string): Promise<Session | null> => {
  // Generate a 6-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
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
};

export const getSessionByCode = async (code: string): Promise<Session | null> => {
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
};

export const endSession = async (code: string): Promise<boolean> => {
  const { error } = await supabase
    .from('sessions')
    .update({ active: false })
    .eq('code', code);
  
  if (error) {
    console.error('Error ending session:', error);
    return false;
  }
  
  return true;
};

// Helper functions for feedback
export const submitFeedback = async (
  sessionCode: string, 
  studentName: string, 
  value: string
): Promise<Feedback | null> => {
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
};

export const getFeedbackForSession = async (sessionCode: string): Promise<Feedback[]> => {
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