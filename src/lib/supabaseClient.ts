import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
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
  pdf_path: string | null;
  processed_content: ProcessedLesson | null;
  created_at: string;
}

// Custom error for storage bucket issues
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export const uploadLessonPlan = async (
  file: File,
  title: string
): Promise<LessonPlan | null> => {
  try {
    if (!file || !title) {
      throw new Error('File and title are required');
    }

    // Create database record first without the file
    const { data: lessonPlan, error: dbError } = await supabase
      .from('lesson_plans')
      .insert([
        {
          title,
          pdf_path: null,
          processed_content: null
        }
      ])
      .select()
      .single();

    if (dbError || !lessonPlan?.id) {
      throw new Error('Error creating lesson plan record: ' + dbError?.message);
    }

    // Upload PDF to storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lessonplans')
      .upload(fileName, file);

    if (uploadError) {
      if (uploadError.message.includes('storage/bucket-not-found')) {
        throw new StorageError(
          'Storage is not properly configured. Please ensure the "lessonplans" bucket exists.'
        );
      }

      // If upload fails, we should delete the lesson plan record
      await supabase
        .from('lesson_plans')
        .delete()
        .eq('id', lessonPlan.id);
      
      throw new Error(uploadError.message);
    }

    if (!uploadData?.path) {
      throw new Error('Upload successful but file path is missing');
    }

    // Update the lesson plan with the file path
    const { data: updatedLessonPlan, error: updateError } = await supabase
      .from('lesson_plans')
      .update({ pdf_path: uploadData.path })
      .eq('id', lessonPlan.id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Error updating lesson plan with file path: ' + updateError.message);
    }

    // Trigger processing with proper validation
    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-lesson`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lessonPlanId: lessonPlan.id,
          content: uploadData.path
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error processing lesson plan:', errorText);
      return updatedLessonPlan;
    }

    const result = await response.json();
    if (result.success) {
      // Update lesson plan with processed content
      const { data: finalLessonPlan } = await supabase
        .from('lesson_plans')
        .update({ processed_content: result.data })
        .eq('id', lessonPlan.id)
        .select()
        .single();
      
      return finalLessonPlan;
    }

    return updatedLessonPlan;
  } catch (err) {
    if (err instanceof StorageError) {
      console.error('Storage configuration error:', err.message);
    } else {
      console.error('Exception in uploadLessonPlan:', err);
    }
    throw err; // Re-throw to handle in the UI
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