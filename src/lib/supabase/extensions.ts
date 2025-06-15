import { supabase } from './client';
import type { ExtensionRequest } from './types';

// Submit an extension request
export const submitExtensionRequest = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<ExtensionRequest | null> => {
  try {
    console.log('Submitting extension request:', {
      presentationId,
      studentName,
      cardIndex
    });
    
    const { data, error } = await supabase
      .from('extension_requests')
      .insert({
        presentation_id: presentationId,
        student_name: studentName,
        card_index: cardIndex,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting extension request:', error);
      return null;
    }

    console.log('Extension request submitted successfully:', data);
    return data;
  } catch (err) {
    console.error('Exception submitting extension request:', err);
    return null;
  }
};

// Approve an extension request
export const approveExtensionRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log('Approving extension request:', requestId);
    
    const { error } = await supabase
      .from('extension_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (error) {
      console.error('Error approving extension request:', error);
      return false;
    }

    console.log('Extension request approved successfully');
    return true;
  } catch (err) {
    console.error('Exception approving extension request:', err);
    return false;
  }
};

// Reject an extension request
export const rejectExtensionRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log('Rejecting extension request:', requestId);
    
    const { error } = await supabase
      .from('extension_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting extension request:', error);
      return false;
    }

    console.log('Extension request rejected successfully');
    return true;
  } catch (err) {
    console.error('Exception rejecting extension request:', err);
    return false;
  }
};

// Get all extension requests for a presentation
export const getExtensionRequestsForPresentation = async (
  presentationId: string
): Promise<ExtensionRequest[]> => {
  try {
    console.log('Getting extension requests for presentation:', presentationId);
    
    const { data, error } = await supabase
      .from('extension_requests')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting extension requests:', error);
      return [];
    }

    console.log('Retrieved extension requests:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('Exception getting extension requests:', err);
    return [];
  }
};

// Check if a student has an extension request for a specific card
export const getStudentExtensionRequestStatus = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<'pending' | 'approved' | 'rejected' | null> => {
  try {
    console.log('Checking extension request status for:', {
      presentationId,
      studentName,
      cardIndex
    });
    
    const { data, error } = await supabase
      .from('extension_requests')
      .select('status')
      .eq('presentation_id', presentationId)
      .eq('student_name', studentName)
      .eq('card_index', cardIndex)
      .maybeSingle();

    if (error) {
      console.error('Error checking extension request status:', error);
      return null;
    }

    console.log('Extension request status:', data?.status || null);
    return data?.status || null;
  } catch (err) {
    console.error('Exception checking extension request status:', err);
    return null;
  }
};

// Subscribe to extension request updates - COMPLETELY REWRITTEN
export const subscribeToExtensionRequests = (
  presentationId: string,
  callback: (request: ExtensionRequest) => void
) => {
  // Generate a unique channel name with timestamp to avoid conflicts
  const timestamp = Date.now();
  const channelName = `extension_requests_${presentationId}_${timestamp}`;
  
  console.log("[Extensions] Setting up subscription on channel:", channelName);
  console.log("[Extensions] For presentationId:", presentationId);
  
  const channel = supabase.channel(channelName);
  
  // Listen for INSERT events with only presentation_id filter
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'extension_requests',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[Extensions] Received INSERT event:', payload);
      if (payload.new) {
        callback(payload.new as ExtensionRequest);
      }
    }
  );
  
  // Listen for UPDATE events with only presentation_id filter
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'extension_requests',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[Extensions] Received UPDATE event:', payload);
      if (payload.new) {
        callback(payload.new as ExtensionRequest);
      }
    }
  );
  
  // Subscribe and log status
  const subscription = channel.subscribe((status, err) => {
    console.log(`[Extensions] Subscription status: ${status}`);
    if (err) {
      console.error('[Extensions] Subscription error:', err);
    } else {
      console.log('[Extensions] Subscription successfully established');
    }
  });
  
  return { unsubscribe: () => subscription.unsubscribe() };
};