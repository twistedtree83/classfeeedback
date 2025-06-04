import { useState } from 'react';
import { sendTeacherMessage } from '../lib/supabase';

export function useTeacherMessaging(presentationId: string | undefined, teacherName: string) {
  const [isSending, setIsSending] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!presentationId || !teacherName || !message.trim()) return false;
    
    setIsSending(true);
    setError(null);
    
    try {
      const success = await sendTeacherMessage(
        presentationId, 
        teacherName, 
        message.trim()
      );
      
      if (!success) {
        setError('Failed to send message.');
      }
      
      return success;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An unexpected error occurred while sending message.');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    showMessageModal,
    error,
    handleSendMessage,
    openMessageModal: () => setShowMessageModal(true),
    closeMessageModal: () => setShowMessageModal(false)
  };
}