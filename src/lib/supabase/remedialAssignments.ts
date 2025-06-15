import { supabase } from './client';
import type { RemedialAssignment } from './types';

/**
 * Assign remedial content to a student for a specific card
 */
export const assignRemedialContent = async (
  presentationId: string,
  studentName: string,
  cardId?: string
): Promise<RemedialAssignment | null> => {
  try {
    console.log('Assigning remedial content:', {
      presentation_id: presentationId,
      student_name: studentName,
      card_id: cardId || 'all cards'
    });
    
    // Use upsert to handle existing assignments
    const { data, error } = await supabase
      .from('remedial_assignments')
      .upsert(
        {
          presentation_id: presentationId,
          student_name: studentName,
          card_id: cardId
        },
        {
          onConflict: 'presentation_id,student_name,card_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error assigning remedial content:', error);
      return null;
    }

    console.log('Remedial assignment created successfully:', data);
    return data;
  } catch (err) {
    console.error('Exception assigning remedial content:', err);
    return null;
  }
};

/**
 * Remove a remedial assignment
 */
export const removeRemedialAssignment = async (
  presentationId: string,
  studentName: string,
  cardId?: string
): Promise<boolean> => {
  try {
    console.log('Removing remedial assignment:', {
      presentation_id: presentationId,
      student_name: studentName,
      card_id: cardId || 'all cards'
    });
    
    let query = supabase
      .from('remedial_assignments')
      .delete()
      .eq('presentation_id', presentationId)
      .eq('student_name', studentName);
    
    // If cardId is provided, filter by it
    if (cardId) {
      query = query.eq('card_id', cardId);
    } else {
      query = query.is('card_id', null);
    }
    
    const { error } = await query;

    if (error) {
      console.error('Error removing remedial assignment:', error);
      return false;
    }

    console.log('Remedial assignment removed successfully');
    return true;
  } catch (err) {
    console.error('Exception removing remedial assignment:', err);
    return false;
  }
};

/**
 * Get all remedial assignments for a presentation
 */
export const getRemedialAssignmentsForPresentation = async (
  presentationId: string
): Promise<RemedialAssignment[]> => {
  try {
    console.log('Getting remedial assignments for presentation:', presentationId);
    
    const { data, error } = await supabase
      .from('remedial_assignments')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting remedial assignments:', error);
      return [];
    }

    console.log('Retrieved remedial assignments:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('Exception getting remedial assignments:', err);
    return [];
  }
};

/**
 * Check if a student has been assigned remedial content
 */
export const checkStudentRemedialStatus = async (
  presentationId: string,
  studentName: string,
  cardId?: string
): Promise<boolean> => {
  try {
    console.log('Checking remedial status for student:', {
      presentation_id: presentationId,
      student_name: studentName,
      card_id: cardId
    });
    
    // First check for specific card assignment
    if (cardId) {
      const { data: cardSpecific, error: cardError } = await supabase
        .from('remedial_assignments')
        .select('id')
        .eq('presentation_id', presentationId)
        .eq('student_name', studentName)
        .eq('card_id', cardId)
        .maybeSingle();
        
      if (cardError) {
        console.error('Error checking card-specific remedial status:', cardError);
      } else if (cardSpecific) {
        return true;
      }
    }
    
    // Then check for all-cards assignment
    const { data, error } = await supabase
      .from('remedial_assignments')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('student_name', studentName)
      .is('card_id', null)
      .maybeSingle();

    if (error) {
      console.error('Error checking general remedial status:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Exception checking remedial status:', err);
    return false;
  }
};

/**
 * Subscribe to remedial assignment changes for a presentation
 */
export const subscribeToRemedialAssignments = (
  presentationId: string,
  callback: (assignment: RemedialAssignment) => void
) => {
  // Generate a unique channel name with timestamp to avoid conflicts
  const timestamp = Date.now();
  const channelName = `remedial_assignments_${presentationId}_${timestamp}`;
  
  console.log("[RemedialAssignments] Setting up subscription on channel:", channelName);
  
  const channel = supabase.channel(channelName);
  
  // Listen for INSERT events
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'remedial_assignments',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[RemedialAssignments] Received INSERT event:', payload);
      if (payload.new) {
        callback(payload.new as RemedialAssignment);
      }
    }
  );
  
  // Listen for DELETE events
  channel.on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'remedial_assignments',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[RemedialAssignments] Received DELETE event:', payload);
      if (payload.old) {
        callback(payload.old as RemedialAssignment);
      }
    }
  );
  
  // Subscribe and log status
  const subscription = channel.subscribe((status, err) => {
    console.log(`[RemedialAssignments] Subscription status: ${status}`);
    if (err) {
      console.error('[RemedialAssignments] Subscription error:', err);
    } else {
      console.log('[RemedialAssignments] Subscription successfully established');
    }
  });
  
  return { unsubscribe: () => subscription.unsubscribe() };
};