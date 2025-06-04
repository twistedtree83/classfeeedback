import { supabase } from './client';
import type { Session, SessionParticipant } from './types';

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

export const getSessionByCode = async (code: string, includeInactive: boolean = false): Promise<Session | null> => {
  try {
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('code', code);
    
    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      query = query.eq('active', true);
    }
    
    const { data, error } = await query.maybeSingle();
    
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

// Participant Management
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

export const getPendingParticipantsForSession = async (sessionCode: string): Promise<SessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_code', sessionCode)
      .eq('status', 'pending')
      .order('joined_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching pending session participants:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching pending session participants:', err);
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
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'session_participants',
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => callback(payload.new as SessionParticipant)
    )
    .subscribe();
};

export const checkParticipantStatus = async (participantId: string): Promise<string | null> => {
  try {
    console.log('Checking status for participant', participantId);
    const { data, error } = await supabase
      .from('session_participants')
      .select('status')
      .eq('id', participantId)
      .single();
    
    if (error) {
      console.error('Error checking participant status:', error);
      return null;
    }
    
    console.log('Participant', participantId, 'status:', data.status);
    return data.status;
  } catch (err) {
    console.error('Exception checking participant status:', err);
    return null;
  }
};

export const approveParticipant = async (participantId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_participants')
      .update({ status: 'approved' })
      .eq('id', participantId);
    
    if (error) {
      console.error('Error approving participant:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception approving participant:', err);
    return false;
  }
};

export const subscribeToParticipantStatus = (
  participantId: string,
  callback: (status: string) => void
) => {
  return supabase
    .channel(`participant_status_${participantId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'session_participants',
        filter: `id=eq.${participantId}`,
      },
      (payload) => {
        if (payload.new && payload.new.status) {
          callback(payload.new.status);
        }
      }
    )
    .subscribe();
};