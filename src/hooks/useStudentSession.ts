import { useState, useEffect } from 'react';
import {
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  getTeacherMessagesForPresentation,
  subscribeToTeacherMessages,
  TeacherMessage,
  LessonPresentation
} from '../lib/supabase';

export function useStudentSession(code: string, studentName: string) {
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<any | null>(null);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState<TeacherMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [teacherName, setTeacherName] = useState('');

  // Join session effect
  useEffect(() => {
    if (!code) return;
    
    const joinSession = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get presentation data
        const presentationData = await getLessonPresentationByCode(code);
        
        if (!presentationData) {
          throw new Error('Session not found or has ended');
        }
        
        setPresentation(presentationData);
        setTeacherName(presentationData.teacher_name || 'Teacher');
        
        // Set current card
        if (presentationData.cards && presentationData.cards.length > 0) {
          setCurrentCard(presentationData.cards[presentationData.current_card_index]);
        }
        
        // Load existing messages
        const existingMessages = await getTeacherMessagesForPresentation(presentationData.id);
        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
        }
        
        setJoined(true);
      } catch (err) {
        console.error('Error joining session:', err);
        setError(err instanceof Error ? err.message : 'Failed to join session');
      } finally {
        setLoading(false);
      }
    };
    
    joinSession();
  }, [code]);

  // Set up subscriptions when joined
  useEffect(() => {
    if (!joined || !presentation) return;
    
    // Subscribe to presentation updates
    const presentationSubscription = subscribeToLessonPresentation(
      code,
      (updatedPresentation) => {
        setPresentation(updatedPresentation);
        
        // Update current card when it changes
        if (updatedPresentation.current_card_index !== presentation.current_card_index) {
          setCurrentCard(updatedPresentation.cards[updatedPresentation.current_card_index]);
        }
      }
    );
    
    // Subscribe to teacher messages
    const messageSubscription = subscribeToTeacherMessages(
      presentation.id,
      (message) => {
        setMessages(prev => [...prev, message]);
        setNewMessage(message);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play prevented by browser policy"));
      }
    );
    
    return () => {
      presentationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [joined, presentation, code]);

  return {
    presentation,
    currentCard,
    messages,
    newMessage,
    loading,
    error,
    joined,
    teacherName,
    // Methods to clear states
    clearNewMessage: () => setNewMessage(null),
    clearError: () => setError(null),
  };
}