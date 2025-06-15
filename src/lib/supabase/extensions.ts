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
    const { error } = await supabase
      .from('extension_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (error) {
      console.error('Error approving extension request:', error);
      return false;
    }

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
    const { error } = await supabase
      .from('extension_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting extension request:', error);
      return false;
    }

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
    const { data, error } = await supabase
      .from('extension_requests')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting extension requests:', error);
      return [];
    }

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

    return data?.status || null;
  } catch (err) {
    console.error('Exception checking extension request status:', err);
    return null;
  }
};

// Subscribe to extension request updates
export const subscribeToExtensionRequests = (
  presentationId: string,
  callback: (request: ExtensionRequest) => void
) => {
  // Generate a more unique channel name
  const channelName = `extension_requests_${presentationId}_${Date.now()}`;
  
  // Comprehensive logging to diagnose subscription issues
  console.log(`[Extension] Creating subscription on channel: ${channelName}`);
  console.log(`[Extension] For presentation ID: ${presentationId}`);

  // Create and configure the subscription
  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'extension_requests',
        filter: `presentation_id=eq.${presentationId}`
      },
      (payload) => {
        console.log('[Extension] Received event:', payload.eventType);
        console.log('[Extension] Payload:', payload);
        
        if (payload.new) {
          // Ensure we have a properly typed object
          const request = payload.new as ExtensionRequest;
          console.log('[Extension] Processing request:', request);
          callback(request);
        }
      }
    )
    .subscribe((status, err) => {
      // Log subscription status for debugging
      console.log(`[Extension] Subscription status: ${status}`);
      if (err) {
        console.error('[Extension] Subscription error:', err);
      } else {
        console.log('[Extension] Subscription successfully established');
      }
    });

  return subscription;
};