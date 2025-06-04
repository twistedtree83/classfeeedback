import { supabase } from './client';
import type { TeacherMessage } from './types';

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
    
    const { data, error } = await supabase
      .from('teacher_messages')
      .insert([{
        presentation_id: presentationId,
        teacher_name: teacherName,
        message_content: messageContent
      }])
      .select();

    if (error) {
      console.error('Error inserting teacher message:', error);
      throw error;
    }
    
    console.log('Teacher message sent successfully, response:', data);
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
    
    console.log(`Retrieved ${data?.length || 0} teacher messages:`, data);
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
    
    console.log(`Creating realtime subscription channel: ${channelId}`);
    
    const subscription = supabase
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
          console.log('REALTIME: Received new teacher message via subscription:', payload);
          callback(payload.new as TeacherMessage);
        }
      )
      .subscribe((status) => {
        console.log(`Teacher messages subscription status (${channelId}):`, status);
      });
    
    return {
      unsubscribe: () => {
        console.log(`Unsubscribing from teacher messages channel ${channelId}`);
        subscription.unsubscribe();
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