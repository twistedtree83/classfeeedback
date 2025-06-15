import { supabase } from './client';
import type { ExtensionRequest } from './types';

// Submit an extension request
export const submitExtensionRequest = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<ExtensionRequest | null> => {
  try {
    console.log('[Extensions] Submitting extension request:', {
      presentation_id: presentationId,
      student_name: studentName,
      card_index: cardIndex,
      status: 'pending'
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
      console.error('[Extensions] Error submitting extension request:', error);
      return null;
    }

    console.log('[Extensions] Request submitted successfully:', data);
    return data;
  } catch (err) {
    console.error('[Extensions] Exception submitting extension request:', err);
    return null;
  }
};

// Approve an extension request
export const approveExtensionRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log('[Extensions] Approving extension request:', requestId);
    
    const { error } = await supabase
      .from('extension_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (error) {
      console.error('[Extensions] Error approving extension request:', error);
      return false;
    }

    console.log('[Extensions] Request approved successfully');
    return true;
  } catch (err) {
    console.error('[Extensions] Exception approving extension request:', err);
    return false;
  }
};

// Reject an extension request
export const rejectExtensionRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log('[Extensions] Rejecting extension request:', requestId);
    
    const { error } = await supabase
      .from('extension_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('[Extensions] Error rejecting extension request:', error);
      return false;
    }

    console.log('[Extensions] Request rejected successfully');
    return true;
  } catch (err) {
    console.error('[Extensions] Exception rejecting extension request:', err);
    return false;
  }
};

// Get all extension requests for a presentation
export const getExtensionRequestsForPresentation = async (
  presentationId: string
): Promise<ExtensionRequest[]> => {
  try {
    console.log('[Extensions] Getting all extension requests for presentation:', presentationId);
    
    const { data, error } = await supabase
      .from('extension_requests')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Extensions] Error getting extension requests:', error);
      return [];
    }

    console.log(`[Extensions] Retrieved ${data?.length || 0} extension requests`);
    return data || [];
  } catch (err) {
    console.error('[Extensions] Exception getting extension requests:', err);
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
    console.log('[Extensions] Checking request status for:', {
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
      console.error('[Extensions] Error checking extension request status:', error);
      return null;
    }

    console.log('[Extensions] Request status result:', data?.status || null);
    return data?.status || null;
  } catch (err) {
    console.error('[Extensions] Exception checking extension request status:', err);
    return null;
  }
};

// Completely rewritten subscription function for extension requests
export const subscribeToExtensionRequests = (
  presentationId: string,
  callback: (request: ExtensionRequest) => void
) => {
  // Create unique channel name
  const timestamp = Date.now();
  const channelName = `extension_requests_${presentationId}_${timestamp}`;
  
  console.log(`[Extensions] Creating subscription on channel: ${channelName}`);
  console.log(`[Extensions] For presentation ID: ${presentationId}`);
  
  const channel = supabase.channel(channelName);
  
  // Listen for INSERT events
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
        const request = payload.new as ExtensionRequest;
        console.log('[Extensions] Processing insert request:', request);
        callback(request);
      }
    }
  );
  
  // Listen for UPDATE events
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
        const request = payload.new as ExtensionRequest;
        console.log('[Extensions] Processing update request:', request);
        callback(request);
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