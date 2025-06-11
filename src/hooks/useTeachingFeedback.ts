import { useState, useEffect } from "react";
import {
  subscribeToTeachingFeedback,
  subscribeToTeachingQuestions,
  getTeachingFeedbackForPresentation,
  getTeachingQuestionsForPresentation,
  getCardFeedbackByStudent,
  markQuestionAsAnswered,
} from "../lib/supabase";

interface Feedback {
  id: string;
  student_name: string;
  feedback_type: string;
  content: string | null;
  created_at: string;
  card_index?: number;
}

interface Question {
  id: string;
  student_name: string;
  question: string;
  answered: boolean;
  created_at: string;
  card_index?: number;
}

interface StudentFeedbackMap {
  [studentName: string]: {
    feedback_type: string;
    timestamp: string;
  };
}

export function useTeachingFeedback(
  presentationId: string,
  currentCardIndex?: number
) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [view, setView] = useState<"chart" | "list" | "questions" | "students">(
    "chart"
  );
  const [loading, setLoading] = useState(true);
  const [newQuestionAlert, setNewQuestionAlert] = useState(false);
  const [filterCurrentCard, setFilterCurrentCard] = useState(true);
  const [studentFeedbackMap, setStudentFeedbackMap] =
    useState<StudentFeedbackMap>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [feedbackData, questionsData] = await Promise.all([
          getTeachingFeedbackForPresentation(
            presentationId,
            filterCurrentCard ? currentCardIndex : undefined
          ),
          getTeachingQuestionsForPresentation(presentationId),
        ]);

        setFeedback(feedbackData);
        setQuestions(questionsData);

        // Build the student feedback map for the current card
        if (currentCardIndex !== undefined) {
          const cardFeedback = await getCardFeedbackByStudent(
            presentationId,
            currentCardIndex
          );
          const feedbackMap: StudentFeedbackMap = {};

          cardFeedback.forEach((item) => {
            feedbackMap[item.student_name] = {
              feedback_type: item.feedback_type,
              timestamp: item.created_at,
            };
          });

          setStudentFeedbackMap(feedbackMap);
        }
      } catch (err) {
        console.error("Error loading feedback and questions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [presentationId, currentCardIndex, filterCurrentCard]);

  // Subscribe to real-time feedback
  useEffect(() => {
    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        // Only update state if the feedback is for the current card (when filtering)
        if (!filterCurrentCard || newFeedback.card_index === currentCardIndex) {
          setFeedback((prev) => {
            // Check if this is an update to existing feedback
            const existingIndex = prev.findIndex(
              (f) =>
                f.student_name === newFeedback.student_name &&
                f.card_index === newFeedback.card_index
            );

            if (existingIndex >= 0) {
              // Replace the existing feedback
              const updated = [...prev];
              updated[existingIndex] = newFeedback;
              return updated;
            }

            // Add new feedback
            return [newFeedback, ...prev];
          });

          // Update student feedback map
          if (newFeedback.card_index === currentCardIndex) {
            setStudentFeedbackMap((prev) => ({
              ...prev,
              [newFeedback.student_name]: {
                feedback_type: newFeedback.feedback_type,
                timestamp: newFeedback.created_at,
              },
            }));
          }
        }
      },
      filterCurrentCard ? currentCardIndex : undefined
    );

    return () => {
      feedbackSubscription.unsubscribe();
    };
  }, [presentationId, currentCardIndex, filterCurrentCard]);

  // Subscribe to real-time questions
  useEffect(() => {
    const questionSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        setQuestions((prev) => [newQuestion, ...prev]);

        // Show notification for new questions
        if (view !== "questions") {
          setNewQuestionAlert(true);
          // Play a subtle notification sound
          const audio = new Audio("/notification.mp3");
          audio
            .play()
            .catch((e) =>
              console.log("Audio play prevented by browser policy")
            );
        }
      },
      filterCurrentCard ? currentCardIndex : undefined
    );

    return () => {
      questionSubscription.unsubscribe();
    };
  }, [presentationId, view, currentCardIndex, filterCurrentCard]);

  // Reset alert when switching to questions view
  useEffect(() => {
    if (view === "questions") {
      setNewQuestionAlert(false);
    }
  }, [view]);

  // Handle card index changes
  useEffect(() => {
    if (currentCardIndex !== undefined && filterCurrentCard) {
      // Reload feedback for the new card
      const loadCardFeedback = async () => {
        try {
          const cardFeedback = await getTeachingFeedbackForPresentation(
            presentationId,
            currentCardIndex
          );
          setFeedback(cardFeedback);

          // Build the student feedback map for the current card
          const feedbackMap: StudentFeedbackMap = {};
          cardFeedback.forEach((item) => {
            feedbackMap[item.student_name] = {
              feedback_type: item.feedback_type,
              timestamp: item.created_at,
            };
          });

          setStudentFeedbackMap(feedbackMap);
        } catch (err) {
          console.error("Error loading card feedback:", err);
        }
      };

      loadCardFeedback();
    }
  }, [presentationId, currentCardIndex, filterCurrentCard]);

  // Count feedback by type
  const feedbackCounts = {
    understand: feedback.filter((f) => f.feedback_type === "understand").length,
    confused: feedback.filter((f) => f.feedback_type === "confused").length,
    slower: feedback.filter((f) => f.feedback_type === "slower").length,
    total: feedback.length,
  };

  // New questions count
  const newQuestionsCount = questions.filter((q) => !q.answered).length;

  // Handle marking a question as answered
  const handleMarkAsAnswered = async (questionId: string) => {
    const success = await markQuestionAsAnswered(questionId);
    if (success) {
      // Update local state to reflect the change
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.id === questionId ? { ...q, answered: true } : q
        )
      );
      // Check if there are still new questions
      const newQuestionsExist = questions.some(
        (q) => !q.answered && q.id !== questionId
      );
      if (!newQuestionsExist) {
        setNewQuestionAlert(false);
      }
      return true;
    }
    return false;
  };

  return {
    feedback,
    questions,
    view,
    setView,
    loading,
    newQuestionAlert,
    filterCurrentCard,
    setFilterCurrentCard,
    studentFeedbackMap,
    feedbackCounts,
    newQuestionsCount,
    handleMarkAsAnswered,
  };
}
