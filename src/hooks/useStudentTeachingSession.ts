import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  getSessionByCode,
  addSessionParticipant,
  subscribeToTeacherMessages,
  getTeacherMessagesForPresentation,
  checkParticipantStatus,
  subscribeToParticipantStatus,
} from "../lib/supabase";
import type {
  LessonPresentation,
  ParticipantStatus,
  TeacherMessage,
} from "../lib/types";

export function useStudentTeachingSession() {
  const location = useLocation();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [status, setStatus] = useState<ParticipantStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState<TeacherMessage | null>(
    null
  );
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Extract code from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setSessionCode(codeParam);
    }
  }, [location]);

  // Check participant approval status with direct subscription
  useEffect(() => {
    if (!participantId || !sessionCode) return;

    console.log(
      `Setting up direct participant status subscription for ${participantId}`
    );

    const subscription = subscribeToParticipantStatus(
      participantId,
      (newStatus) => {
        console.log(
          `Received status update for participant ${participantId}: ${newStatus}`
        );

        // Update the status state
        setStatus(newStatus as ParticipantStatus);

        // Handle approval
        if (newStatus === "approved") {
          console.log("Participant approved - transitioning to teaching view");
          setJoined(true);

          // Get presentation data
          getLessonPresentationByCode(sessionCode)
            .then((presentationData) => {
              if (presentationData) {
                console.log("Approved for teaching session:", presentationData);
                setPresentation(presentationData);
              } else {
                console.error("Presentation not found after approval");
                setError("Presentation not found");
              }
            })
            .catch((err) => {
              console.error("Error loading presentation after approval:", err);
              setError("Error loading presentation");
            });
        }
      }
    );

    // Initial status check
    const checkStatus = async () => {
      setChecking(true);
      try {
        console.log(
          `Performing initial status check for participant ${participantId}`
        );
        const currentStatus = await checkParticipantStatus(participantId);
        console.log("Current participant status:", currentStatus);

        setStatus(currentStatus as ParticipantStatus);

        if (currentStatus === "approved") {
          setJoined(true);
          // Get presentation data
          const presentationData = await getLessonPresentationByCode(
            sessionCode
          );
          if (presentationData) {
            console.log(
              "Initially approved for teaching session:",
              presentationData
            );
            setPresentation(presentationData);
          } else {
            console.error("Presentation not found on initial check");
            setError("Presentation not found");
          }
        }
      } catch (err) {
        console.error("Error in initial status check:", err);
      } finally {
        setChecking(false);
      }
    };

    // Run the initial check
    checkStatus();

    // Set up a polling fallback just in case the subscription doesn't work
    const pollingInterval = setInterval(checkStatus, 5000);

    return () => {
      console.log("Cleaning up participant status subscription and polling");
      subscription.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [participantId, sessionCode]);

  // Load past teacher messages when joining a session
  useEffect(() => {
    if (!presentation?.id) return;

    const loadTeacherMessages = async () => {
      try {
        console.log(
          "Loading teacher messages for presentation:",
          presentation.id
        );
        const messages = await getTeacherMessagesForPresentation(
          presentation.id
        );
        console.log("LOADED TEACHER MESSAGES:", messages);

        if (messages && Array.isArray(messages)) {
          setAllMessages(messages);

          // If there are messages, show a notification
          if (messages.length > 0) {
            setNewMessageCount(messages.length);
            // Set the most recent message as the toast notification
            setTeacherMessage(messages[messages.length - 1]);
          }
        }
      } catch (err) {
        console.error("Error loading teacher messages:", err);
      }
    };

    loadTeacherMessages();
  }, [presentation?.id]);

  // Subscribe to presentation updates
  useEffect(() => {
    if (!presentation?.session_code || !joined) return;

    console.log(
      "Setting up presentation subscription for:",
      presentation.session_code
    );

    const subscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        console.log("Received presentation update:", updatedPresentation);
        setPresentation(updatedPresentation);
      }
    );

    return () => {
      console.log("Cleaning up presentation subscription");
      subscription.unsubscribe();
    };
  }, [presentation?.session_code, joined]);

  // Subscribe to teacher messages
  useEffect(() => {
    if (!presentation?.id || !joined) return;

    console.log(
      "Setting up teacher messages subscription for:",
      presentation.id
    );

    const subscription = subscribeToTeacherMessages(
      presentation.id,
      (newMessage) => {
        console.log("REALTIME: Received new teacher message:", newMessage);

        setAllMessages((prev) => [...prev, newMessage]);
        setTeacherMessage(newMessage);
        setNewMessageCount((prev) => prev + 1);
      }
    );

    return () => {
      console.log("Cleaning up teacher messages subscription");
      subscription.unsubscribe();
    };
  }, [presentation?.id, joined]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode || !studentName) return;

    setLoading(true);
    setError(null);

    try {
      // First check if session exists
      const session = await getSessionByCode(sessionCode);
      if (!session) {
        setError("Session not found. Please check the code and try again.");
        return;
      }

      // Add participant to session
      const participant = await addSessionParticipant(sessionCode, studentName);
      if (participant) {
        console.log("Added as participant:", participant);
        setParticipantId(participant.id);
        setStatus("pending");
      } else {
        setError("Failed to join session. Please try again.");
      }
    } catch (err) {
      console.error("Error joining session:", err);
      setError("Failed to join session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    presentation,
    loading,
    error,
    sessionCode,
    studentName,
    joined,
    participantId,
    status,
    checking,
    teacherMessage,
    allMessages,
    newMessageCount,

    // Actions
    setSessionCode,
    setStudentName,
    setTeacherMessage,
    setNewMessageCount,
    handleJoinSession,

    // Computed values
    currentCard: presentation?.cards?.[presentation.current_card_index],
    isFirstCard: presentation?.current_card_index === 0,
    isLastCard:
      presentation?.current_card_index ===
      (presentation?.cards.length ?? 0) - 1,
  };
}
