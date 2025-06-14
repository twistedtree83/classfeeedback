import { supabase } from './client';
import type { ExtensionRequest } from './types';

// Submit an extension request
export const submitExtensionRequest = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<ExtensionRequest | null> => {
  try {
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

    if (error && error.code !== 'PGRST116') {
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
  const channelName = `extension_requests:${presentationId}`;
  
  const subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'extension_requests',
        filter: `presentation_id=eq.${presentationId}`
      },
      (payload) => {
        console.log('Extension request change:', payload);
        if (payload.new) {
          callback(payload.new as ExtensionRequest);
        }
      }
    )
    .subscribe();

  return subscription;
};