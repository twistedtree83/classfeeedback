import { useState, useEffect, useCallback } from 'react';
import {
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  getTeacherMessagesForPresentation,
  subscribeToTeacherMessages,
  getSessionByCode,
  TeacherMessage,
  LessonPresentation,
  LessonCard,
  CardAttachment
} from '../lib/supabase';

export function useStudentSession(code: string, studentName: string) {
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<LessonCard | null>(null);
  const [currentCardAttachments, setCurrentCardAttachments] = useState<CardAttachment[]>([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState<TeacherMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [lessonStarted, setLessonStarted] = useState(false);

  // Function to update the current card based on index
  const updateCurrentCard = useCallback((presentation: LessonPresentation, index: number) => {
    if (!presentation?.cards || !Array.isArray(presentation.cards) || index < 0 || index >= presentation.cards.length) {
      setCurrentCard(null);
      setCurrentCardAttachments([]);
      return;
    }

    const card = presentation.cards[index];
    console.log(`Updating to card ${index}:`, card);
    
    setCurrentCard(card);
    setCurrentCardAttachments(card.attachments || []);
    
    // Check if this is a valid card index (not the welcome card), which indicates the lesson has started
    // Changed from `> 0` to `>= 0` to start the lesson when current_card_index is 0
    if (index >= 0) {
      setLessonStarted(true);
    }
  }, []);

  // Join session effect
  useEffect(() => {
    if (!code) return;
    
    const joinSession = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get session info first
        const sessionData = await getSessionByCode(code);
        if (!sessionData) {
          throw new Error('Session not found or has ended');
        }
        
        setTeacherName(sessionData.teacher_name || 'Teacher');
        
        // Get presentation data
        const presentationData = await getLessonPresentationByCode(code);
        
        if (!presentationData) {
          throw new Error('Session not found or has ended');
        }
        
        console.log("Setting presentation data:", presentationData);
        setPresentation(presentationData);
        
        // Set current card
        updateCurrentCard(presentationData, presentationData.current_card_index);
        
        // Load existing messages
        const existingMessages = await getTeacherMessagesForPresentation(presentationData.id);
        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
        }
        
        setJoined(true);
        
        // Check if the lesson has already started (using >= 0 instead of > 0)
        if (presentationData.current_card_index >= 0) {
          setLessonStarted(true);
        }
      } catch (err) {
        console.error('Error joining session:', err);
        setError(err instanceof Error ? err.message : 'Failed to join session');
      } finally {
        setLoading(false);
      }
    };
    
    joinSession();
  }, [code, updateCurrentCard]);

  // Set up subscriptions when joined
  useEffect(() => {
    if (!joined || !presentation || !presentation.session_code) return;
    
    // Subscribe to presentation updates
    console.log(`Setting up presentation subscription for session code: ${presentation.session_code}`);
    
    const presentationSubscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        console.log(`Received presentation update: current_card_index=${updatedPresentation.current_card_index}, previous=${presentation.current_card_index}`);
        
        // When the card index changes, update the presentation and current card immediately
        if (updatedPresentation.current_card_index !== presentation.current_card_index) {
          console.log(`Card changed from ${presentation.current_card_index} to ${updatedPresentation.current_card_index}`);
          
          // Update current presentation state
          setPresentation(prev => {
            if (!prev) return updatedPresentation;
            
            // Create a copy of the updated presentation with the new card index
            const updated = {
              ...prev,
              current_card_index: updatedPresentation.current_card_index
            };
            
            // Update current card immediately 
            updateCurrentCard(updated, updatedPresentation.current_card_index);
            
            // Check if lesson has started - changed to check for >= 0 instead of > 0
            if (updatedPresentation.current_card_index >= 0) {
              setLessonStarted(true);
            }
            
            return updated;
          });
        }
      }
    );
    
    // Subscribe to teacher messages
    const messageSubscription = subscribeToTeacherMessages(
      presentation.id,
      (message) => {
        console.log("Received teacher message:", message);
        setMessages(prev => [...prev, message]);
        setNewMessage(message);
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play prevented by browser policy:", e));
        } catch (err) {
          console.error("Error playing notification sound:", err);
        }
      }
    );
    
    return () => {
      console.log("Cleaning up subscriptions");
      presentationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      console.log("Cleaned up subscriptions");
    };
  }, [joined, presentation, updateCurrentCard]);

  return {
    presentation,
    currentCard,
    currentCardAttachments,
    messages,
    newMessage,
    loading,
    error,
    joined,
    teacherName,
    lessonStarted,
    // Methods to clear states
    clearNewMessage: () => setNewMessage(null),
    clearError: () => setError(null),
  };
}