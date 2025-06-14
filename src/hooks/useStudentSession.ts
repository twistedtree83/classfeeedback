import { useState, useEffect, useCallback } from "react";
import {
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  getSessionByCode,
  getTeacherMessagesForPresentation,
  subscribeToTeacherMessages,
  LessonPresentation,
  LessonCard,
  CardAttachment,
  TeacherMessage,
} from "../lib/supabase";

export function useStudentSession(code: string, studentName: string) {
  const [presentation, setPresentation] = useState<LessonPresentation | null>(
    null
  );
  const [currentCard, setCurrentCard] = useState<LessonCard | null>(null);
  const [currentCardAttachments, setCurrentCardAttachments] = useState<
    CardAttachment[]
  >([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState<TeacherMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [lessonStarted, setLessonStarted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<
    { unsubscribe: () => void }[]
  >([]);

  // Function to update the current card based on index
  const updateCurrentCard = useCallback(
    (presentation: LessonPresentation, index: number) => {
      // If index is -1, we're in waiting room state
      if (index === -1) {
        setCurrentCard(null);
        setCurrentCardAttachments([]);
        setLessonStarted(false);
        return;
      }

      if (
        !presentation?.cards ||
        !Array.isArray(presentation.cards) ||
        index < 0 ||
        index >= presentation.cards.length
      ) {
        setCurrentCard(null);
        setCurrentCardAttachments([]);
        return;
      }

      const card = presentation.cards[index];
      console.log(`Updating to card ${index}:`, card);

      setCurrentCard(card);
      setCurrentCardAttachments(card.attachments || []);

      // Lesson has started when we have a valid card index (>= 0)
      setLessonStarted(true);
    },
    []
  );

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
          throw new Error("Session not found or has ended");
        }

        setTeacherName(sessionData.teacher_name || "Teacher");

        // Get presentation data
        const presentationData = await getLessonPresentationByCode(code);

        if (!presentationData) {
          throw new Error("Session not found or has ended");
        }

        console.log("Setting presentation data:", presentationData);
        setPresentation(presentationData);

        // Check if the lesson has started based on lesson_state
        const hasValidCards = presentationData.cards && 
                             Array.isArray(presentationData.cards) && 
                             presentationData.cards.length > 0;
        
        // FIXED: Use lesson_state as the primary indicator, with current_card_index as fallback
        const teacherHasStarted = presentationData.lesson_state === true;
        
        // Set lesson started state based on lesson_state
        setLessonStarted(teacherHasStarted);

        // Set current card based on the current_card_index only if lesson has started
        if (hasValidCards && teacherHasStarted && presentationData.current_card_index >= 0) {
          updateCurrentCard(
            presentationData,
            presentationData.current_card_index
          );
        } else {
          // We're in waiting room state
          setCurrentCard(null);
          setCurrentCardAttachments([]);
        }

        // Load existing messages
        const existingMessages = await getTeacherMessagesForPresentation(
          presentationData.id
        );
        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
        }

        setJoined(true);
      } catch (err) {
        console.error("Error joining session:", err);
        setError(err instanceof Error ? err.message : "Failed to join session");
      } finally {
        setLoading(false);
      }
    };

    joinSession();
  }, [code, updateCurrentCard]);

  // Set up subscriptions when joined
  useEffect(() => {
    if (!joined || !presentation || !presentation.session_code) return;
    
    // Clean up existing subscriptions first to avoid duplicates
    subscriptions.forEach(sub => sub.unsubscribe());
    setSubscriptions([]);

    const newSubscriptions = [];

    // Subscribe to presentation updates
    console.log(
      `Setting up presentation subscription for session code: ${presentation.session_code}`
    );

    const presentationSubscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        console.log(
          `Received presentation update: current_card_index=${updatedPresentation.current_card_index}, previous=${presentation.current_card_index}, lesson_state=${updatedPresentation.lesson_state}`
        );

        // FIXED: Check for changes in both lesson_state and current_card_index
        if (
          updatedPresentation.lesson_state !== presentation.lesson_state ||
          updatedPresentation.current_card_index !== presentation.current_card_index
        ) {
          console.log(
            `State changed: lesson_state from ${presentation.lesson_state} to ${updatedPresentation.lesson_state}, card from ${presentation.current_card_index} to ${updatedPresentation.current_card_index}`
          );

          // Update current presentation state
          setPresentation((prev) => {
            if (!prev) return updatedPresentation;

            // Create a copy of the updated presentation with the new state
            const updated = {
              ...prev,
              current_card_index: updatedPresentation.current_card_index,
              lesson_state: updatedPresentation.lesson_state
            };

            // Check if the lesson has started based on lesson_state
            const hasStarted = updatedPresentation.lesson_state === true;
            setLessonStarted(hasStarted);

            // Update current card only if lesson has started and we have a valid index
            if (hasStarted && updatedPresentation.current_card_index >= 0) {
              updateCurrentCard(updated, updatedPresentation.current_card_index);
            } else {
              // We're in waiting room state
              setCurrentCard(null);
              setCurrentCardAttachments([]);
            }

            return updated;
          });
        }
      }
    );
    newSubscriptions.push(presentationSubscription);

    // Subscribe to teacher messages
    const messageSubscription = subscribeToTeacherMessages(
      presentation.id,
      (message) => {
        console.log("Received teacher message:", message);
        setMessages((prev) => [...prev, message]);
        setNewMessage(message);

        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.5;
          audio
            .play()
            .catch((e) =>
              console.log("Audio play prevented by browser policy:", e)
            );
        } catch (err) {
          console.error("Error playing notification sound:", err);
        }
      }
    );
    newSubscriptions.push(messageSubscription);

    // Save subscriptions for cleanup
    setSubscriptions(newSubscriptions);

    // Only clean up when unmounting or when code/presentation changes
    return () => {
      console.log("Cleaning up subscriptions");
      newSubscriptions.forEach(sub => sub.unsubscribe());
      console.log("Cleaned up subscriptions");
    };
  }, [joined, presentation?.id, presentation?.session_code, updateCurrentCard]);

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