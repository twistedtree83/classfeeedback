import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import type { ProcessedLesson, LessonCard, TeacherMessage } from "./types";

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth functions
export type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const signUp = async (
  email: string,
  password: string,
  fullName: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error("Exception during signup:", err);
    return { user: null, error: "An unexpected error occurred during signup." };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error("Exception during signin:", err);
    return { user: null, error: "An unexpected error occurred during signin." };
  }
};

export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Exception during signout:", err);
    return { error: "An unexpected error occurred during signout." };
  }
};

export const resetPassword = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Exception during password reset:", err);
    return { error: "An unexpected error occurred during password reset." };
  }
};

export const updatePassword = async (
  newPassword: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("Exception during password update:", err);
    return { error: "An unexpected error occurred during password update." };
  }
};

// Define types for our Supabase tables
export interface Session {
  id: string;
  code: string;
  created_at: string;
  teacher_name: string;
  active: boolean;
}

export interface Feedback {
  id: string;
  session_code: string;
  student_name: string;
  value: string;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_code: string;
  student_name: string;
  joined_at: string;
  status: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  processed_content: ProcessedLesson | null;
  created_at: string;
  level?: string;
}

export interface LessonPresentation {
  id: string;
  lesson_id: string;
  session_code: string;
  session_id: string;
  current_card_index: number;
  cards: LessonCard[];
  active: boolean;
  created_at: string;
  realtime_enabled: boolean;
}

export const getLessonPlanById = async (
  id: string
): Promise<LessonPlan | null> => {
  try {
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching lesson plan:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception fetching lesson plan:", err);
    return null;
  }
};

export const createLessonPresentation = async (
  lessonId: string,
  cards: LessonCard[],
  teacherName: string
): Promise<LessonPresentation | null> => {
  let code: string;

  try {
    // Validate cards structure
    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error("Invalid cards data");
    }

    // Validate each card has required properties
    const validCards = cards.map((card) => {
      if (!card.id || !card.type || !card.title || !card.content) {
        throw new Error("Each card must have id, type, title, and content");
      }

      if (
        ![
          "objective",
          "material",
          "section",
          "activity",
          "custom",
          "topic_background",
        ].includes(card.type)
      ) {
        throw new Error(`Invalid card type: ${card.type}`);
      }

      return {
        id: card.id,
        type: card.type,
        title: String(card.title),
        content: String(card.content),
        duration: card.duration || null,
        sectionId: typeof card.sectionId === "string" ? card.sectionId : null,
        activityIndex:
          typeof card.activityIndex === "number" ? card.activityIndex : null,
        studentFriendly: card.studentFriendly || false,
        originalContent: card.originalContent || null,
        differentiatedContent: card.differentiatedContent || null,
        isDifferentiated: card.isDifferentiated || false,
      };
    });

    code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // First create a session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          code,
          teacher_name: teacherName,
          active: true,
        },
      ])
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Then create the presentation linked to the session
    const presentationData = {
      lesson_id: lessonId,
      session_code: code,
      session_id: session.id,
      cards: validCards, // Use validated cards
      current_card_index: -1, // Start at -1 so the first "Next" goes to index 0
      active: true,
    };

    const { data, error } = await supabase
      .from("lesson_presentations")
      .insert([presentationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating lesson presentation:", err);
    // Clean up session if presentation creation fails
    if (code) {
      await supabase.from("sessions").delete().eq("code", code);
    }
    return null;
  }
};

export const getLessonPresentationByCode = async (
  code: string,
  includeInactive: boolean = false
): Promise<LessonPresentation | null> => {
  try {
    console.log("Student requesting presentation for code:", code);

    // First check if session exists
    const sessionQuery = supabase.from("sessions").select("*").eq("code", code);

    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      sessionQuery.eq("active", true);
    }

    const { data: session, error: sessionError } =
      await sessionQuery.maybeSingle();

    if (sessionError) {
      console.error("Session not found or inactive:", sessionError);
      return null;
    }

    if (!session) {
      console.log("No active session found with code:", code);
      return null;
    }

    console.log("Found active session:", JSON.stringify(session, null, 2));

    // Now get the presentation
    const presentationQuery = supabase
      .from("lesson_presentations")
      .select("*")
      .eq("session_code", code);

    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      presentationQuery.eq("active", true);
    }

    const { data, error } = await presentationQuery.maybeSingle();

    if (error) {
      console.error("Error fetching presentation:", error);
      return null;
    }

    if (!data) {
      console.log("No active presentation found with code:", code);
      return null;
    }

    console.log(
      "Retrieved presentation data for students:",
      JSON.stringify(data, null, 2)
    );
    console.log("Presentation cards type:", typeof data.cards);
    console.log("Presentation cards is array:", Array.isArray(data.cards));
    if (Array.isArray(data.cards) && data.cards.length > 0) {
      console.log("First card:", JSON.stringify(data.cards[0], null, 2));
    }

    // No need to parse cards - Supabase automatically handles JSONB
    return data;
  } catch (err) {
    console.error("Error fetching lesson presentation:", err);
    return null;
  }
};

export const updateLessonPresentationCardIndex = async (
  presentationId: string,
  newIndex: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("lesson_presentations")
      .update({ current_card_index: newIndex })
      .eq("id", presentationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating card index:", err);
    return false;
  }
};

export const endLessonPresentation = async (
  presentationId: string
): Promise<boolean> => {
  try {
    // Get the presentation first to get the session code
    const { data: presentation, error: fetchError } = await supabase
      .from("lesson_presentations")
      .select("session_code")
      .eq("id", presentationId)
      .single();

    if (fetchError) throw fetchError;

    // End both the presentation and its associated session
    const { error: presentationError } = await supabase
      .from("lesson_presentations")
      .update({ active: false })
      .eq("id", presentationId);

    if (presentationError) throw presentationError;

    const { error: sessionError } = await supabase
      .from("sessions")
      .update({ active: false })
      .eq("code", presentation.session_code);

    if (sessionError) throw sessionError;

    return true;
  } catch (err) {
    console.error("Error ending presentation:", err);
    return false;
  }
};

export const subscribeToLessonPresentation = (
  code: string,
  callback: (payload: LessonPresentation) => void
) => {
  return supabase
    .channel("lesson_presentations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "lesson_presentations",
        filter: `session_code=eq.${code}`,
      },
      (payload) => callback(payload.new as LessonPresentation)
    )
    .subscribe();
};

// Helper functions for sessions
export const createSession = async (
  teacherName: string
): Promise<Session | null> => {
  // Generate a 6-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          code,
          teacher_name: teacherName,
          active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception creating session:", err);
    return null;
  }
};

export const getSessionByCode = async (
  code: string,
  includeInactive: boolean = false
): Promise<Session | null> => {
  try {
    let query = supabase.from("sessions").select("*").eq("code", code);

    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception fetching session:", err);
    return null;
  }
};

export const endSession = async (code: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("sessions")
      .update({ active: false })
      .eq("code", code);

    if (error) {
      console.error("Error ending session:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception ending session:", err);
    return false;
  }
};

// Helper functions for session participants
export const addSessionParticipant = async (
  sessionCode: string,
  studentName: string
): Promise<SessionParticipant | null> => {
  try {
    const { data, error } = await supabase
      .from("session_participants")
      .insert([
        {
          session_code: sessionCode,
          student_name: studentName,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding session participant:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception adding session participant:", err);
    return null;
  }
};

export const getParticipantsForSession = async (
  sessionCode: string
): Promise<SessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_code", sessionCode)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching session participants:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching session participants:", err);
    return [];
  }
};

export const getPendingParticipantsForSession = async (
  sessionCode: string
): Promise<SessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_code", sessionCode)
      .eq("status", "pending")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching pending session participants:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching pending session participants:", err);
    return [];
  }
};

export const subscribeToSessionParticipants = (
  sessionCode: string,
  callback: (payload: SessionParticipant) => void
) => {
  return supabase
    .channel("public:session_participants")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "session_participants",
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => callback(payload.new as SessionParticipant)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "session_participants",
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => callback(payload.new as SessionParticipant)
    )
    .subscribe();
};

// Function to check participant status
export const checkParticipantStatus = async (
  participantId: string
): Promise<string | null> => {
  try {
    console.log("Checking status for participant", participantId);
    const { data, error } = await supabase
      .from("session_participants")
      .select("status")
      .eq("id", participantId)
      .single();

    if (error) {
      console.error("Error checking participant status:", error);
      return null;
    }

    console.log("Participant", participantId, "status:", data.status);
    return data.status;
  } catch (err) {
    console.error("Exception checking participant status:", err);
    return null;
  }
};

// Function to approve a participant
export const approveParticipant = async (
  participantId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("session_participants")
      .update({ status: "approved" })
      .eq("id", participantId);

    if (error) {
      console.error("Error approving participant:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception approving participant:", err);
    return false;
  }
};

// Subscribe to participant status changes
export const subscribeToParticipantStatus = (
  participantId: string,
  callback: (status: string) => void
) => {
  return supabase
    .channel(`participant_status_${participantId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "session_participants",
        filter: `id=eq.${participantId}`,
      },
      (payload) => {
        if (payload.new && payload.new.status) {
          callback(payload.new.status);
        }
      }
    )
    .subscribe();
};

// Helper functions for feedback
export const submitFeedback = async (
  sessionCode: string,
  studentName: string,
  value: string
): Promise<Feedback | null> => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .insert([
        {
          session_code: sessionCode,
          student_name: studentName,
          value,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error submitting feedback:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception submitting feedback:", err);
    return null;
  }
};

export const getFeedbackForSession = async (
  sessionCode: string
): Promise<Feedback[]> => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("session_code", sessionCode)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching feedback:", err);
    return [];
  }
};

export const subscribeToSessionFeedback = (
  sessionCode: string,
  callback: (payload: Feedback) => void
) => {
  return supabase
    .channel("public:feedback")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "feedback",
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => callback(payload.new as Feedback)
    )
    .subscribe();
};

// Teaching feedback
export const submitTeachingFeedback = async (
  presentationId: string,
  studentName: string,
  feedbackType: string,
  cardIndex?: number,
  content?: string
): Promise<boolean> => {
  try {
    // Check if the student has already submitted feedback for this card
    if (cardIndex !== undefined) {
      const { data: existingFeedback, error: checkError } = await supabase
        .from("teaching_feedback")
        .select("id")
        .eq("presentation_id", presentationId)
        .eq("student_name", studentName)
        .eq("card_index", cardIndex)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing feedback:", checkError);
      }

      // If student already provided feedback for this card, update instead of insert
      if (existingFeedback) {
        const { error: updateError } = await supabase
          .from("teaching_feedback")
          .update({
            feedback_type: feedbackType,
            content,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingFeedback.id);

        if (updateError) {
          console.error("Error updating existing feedback:", updateError);
          return false;
        }

        return true;
      }
    }

    // No existing feedback found or card index not provided, insert new feedback
    const { error } = await supabase.from("teaching_feedback").insert([
      {
        presentation_id: presentationId,
        student_name: studentName,
        feedback_type: feedbackType,
        card_index: cardIndex,
        content,
      },
    ]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error submitting teaching feedback:", err);
    return false;
  }
};

export const submitTeachingQuestion = async (
  presentationId: string,
  studentName: string,
  question: string,
  cardIndex?: number
): Promise<boolean> => {
  try {
    console.log("Submitting question:", {
      presentation_id: presentationId,
      student_name: studentName,
      question: question,
      card_index: cardIndex,
    });

    const { data, error } = await supabase
      .from("teaching_questions")
      .insert([
        {
          presentation_id: presentationId,
          student_name: studentName,
          question,
          card_index: cardIndex,
        },
      ])
      .select();

    if (error) {
      console.error("Database error submitting question:", error);
      throw error;
    }

    console.log("Question submitted successfully, response:", data);
    return true;
  } catch (err) {
    console.error("Error submitting question:", err);
    return false;
  }
};

export const getStudentFeedbackForCard = async (
  presentationId: string,
  studentName: string,
  cardIndex: number
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from("teaching_feedback")
      .select("*")
      .eq("presentation_id", presentationId)
      .eq("student_name", studentName)
      .eq("card_index", cardIndex)
      .maybeSingle();

    if (error) {
      console.error("Error fetching student feedback for card:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception fetching student feedback for card:", err);
    return null;
  }
};

export const markQuestionAsAnswered = async (
  questionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("teaching_questions")
      .update({ answered: true })
      .eq("id", questionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error marking question as answered:", err);
    return false;
  }
};

export const getTeachingQuestionsForPresentation = async (
  presentationId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("teaching_questions")
      .select("*")
      .eq("presentation_id", presentationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching teaching questions:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching teaching questions:", err);
    return [];
  }
};

export const getTeachingFeedbackForPresentation = async (
  presentationId: string,
  cardIndex?: number
): Promise<any[]> => {
  try {
    let query = supabase
      .from("teaching_feedback")
      .select("*")
      .eq("presentation_id", presentationId);

    // Filter by card index if provided
    if (cardIndex !== undefined) {
      query = query.eq("card_index", cardIndex);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching teaching feedback:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching teaching feedback:", err);
    return [];
  }
};

export const subscribeToTeachingFeedback = (
  presentationId: string,
  callback: (feedback: any) => void,
  cardIndex?: number
) => {
  // Create a filter including the card index if provided
  const filter =
    cardIndex !== undefined
      ? `presentation_id=eq.${presentationId}&card_index=eq.${cardIndex}`
      : `presentation_id=eq.${presentationId}`;

  return supabase
    .channel("teaching_feedback")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "teaching_feedback",
        filter,
      },
      (payload) => callback(payload.new)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "teaching_feedback",
        filter,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void,
  cardIndex?: number
) => {
  // Create a filter including the card index if provided
  const filter =
    cardIndex !== undefined
      ? `presentation_id=eq.${presentationId}&card_index=eq.${cardIndex}`
      : `presentation_id=eq.${presentationId}`;

  return supabase
    .channel("teaching_questions")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "teaching_questions",
        filter,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

// Get feedback stats grouped by student and feedback type for a specific card
export const getCardFeedbackByStudent = async (
  presentationId: string,
  cardIndex: number
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("teaching_feedback")
      .select("*")
      .eq("presentation_id", presentationId)
      .eq("card_index", cardIndex);

    if (error) {
      console.error("Error fetching card feedback by student:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching card feedback by student:", err);
    return [];
  }
};

// Teacher messages functions
export const sendTeacherMessage = async (
  presentationId: string,
  teacherName: string,
  messageContent: string
): Promise<boolean> => {
  try {
    console.log("Sending teacher message:", {
      presentation_id: presentationId,
      teacher_name: teacherName,
      message_content: messageContent,
    });

    const { data, error } = await supabase
      .from("teacher_messages")
      .insert([
        {
          presentation_id: presentationId,
          teacher_name: teacherName,
          message_content: messageContent,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting teacher message:", error);
      throw error;
    }

    console.log("Teacher message sent successfully, response:", data);
    return true;
  } catch (err) {
    console.error("Error sending teacher message:", err);
    return false;
  }
};

export const getTeacherMessagesForPresentation = async (
  presentationId: string
): Promise<TeacherMessage[]> => {
  try {
    console.log("Fetching teacher messages for presentation:", presentationId);
    const { data, error } = await supabase
      .from("teacher_messages")
      .select("*")
      .eq("presentation_id", presentationId)
      .order("created_at", { ascending: true }); // Ascending for conversation flow

    if (error) {
      console.error("Error fetching teacher messages:", error);
      return [];
    }

    console.log(`Retrieved ${data?.length || 0} teacher messages:`, data);
    return data || [];
  } catch (err) {
    console.error("Exception fetching teacher messages:", err);
    return [];
  }
};

export const subscribeToTeacherMessages = (
  presentationId: string,
  callback: (message: TeacherMessage) => void
) => {
  console.log(
    "Setting up subscription for teacher messages on presentation:",
    presentationId
  );

  try {
    // Create a unique channel ID to prevent conflicts
    const channelId = `teacher_messages_${presentationId}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    console.log(`Creating realtime subscription channel: ${channelId}`);

    const subscription = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "teacher_messages",
          filter: `presentation_id=eq.${presentationId}`,
        },
        (payload) => {
          console.log(
            "REALTIME: Received new teacher message via subscription:",
            payload
          );
          callback(payload.new as TeacherMessage);
        }
      )
      .subscribe((status) => {
        console.log(
          `Teacher messages subscription status (${channelId}):`,
          status
        );
      });

    return {
      unsubscribe: () => {
        console.log(`Unsubscribing from teacher messages channel ${channelId}`);
        subscription.unsubscribe();
      },
    };
  } catch (error) {
    console.error("Error setting up teacher messages subscription:", error);
    // Return a dummy subscription with unsubscribe method to prevent crashes
    return {
      unsubscribe: () => console.log("Dummy unsubscribe called"),
    };
  }
};

// Generate a random name function for anonymous students
export const generateRandomName = (): string => {
  const adjectives = [
    "Happy",
    "Bright",
    "Clever",
    "Quick",
    "Kind",
    "Brave",
    "Swift",
    "Wise",
    "Calm",
    "Noble",
  ];

  const nouns = [
    "Student",
    "Scholar",
    "Learner",
    "Thinker",
    "Mind",
    "Explorer",
    "Achiever",
    "Reader",
    "Creator",
    "Genius",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective}${randomNoun}`;
};

// Group feedback by type
export const groupFeedbackByType = (feedback: Array<{ value: string }>) => {
  const counts = {
    "👍": 0,
    "😕": 0,
    "❓": 0,
  };

  feedback.forEach((item) => {
    if (item.value in counts) {
      counts[item.value as keyof typeof counts]++;
    }
  });

  return counts;
};
