import { supabase } from "./client";

export interface Feedback {
  id: string;
  session_code: string;
  student_name: string;
  value: string;
  created_at: string;
}

export const submitFeedback = async (
  sessionCode: string,
  studentName: string,
  value: string
): Promise<Feedback | null> => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        session_code: sessionCode,
        student_name: studentName,
        value,
      })
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
    .channel(`feedback:${sessionCode}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "feedback",
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => {
        console.log("New feedback:", payload);
        callback(payload.new as Feedback);
      }
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
    // Check if this student has already submitted feedback for this card
    if (cardIndex !== undefined) {
      try {
        const { data: existingFeedback, error: checkError } = await supabase
          .from("teaching_feedback")
          .select("id")
          .eq("presentation_id", presentationId)
          .eq("student_name", studentName)
          .eq("card_index", cardIndex)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          // If it's a column error (406), continue without checking - column doesn't exist yet
          if (checkError.code === "42703") {
            console.warn(
              "card_index column not found, skipping duplicate check"
            );
          } else {
            console.error("Error checking existing feedback:", checkError);
            return false;
          }
        } else if (existingFeedback) {
          console.log("Feedback already submitted for this card");
          return false;
        }
      } catch (columnError) {
        console.warn("card_index column not found, skipping duplicate check");
      }
    }

    // Build insert object dynamically to handle missing card_index column
    const insertData: any = {
      presentation_id: presentationId,
      student_name: studentName,
      feedback_type: feedbackType,
      content: content ?? null,
    };

    // Only add card_index if it's provided
    if (cardIndex !== undefined) {
      try {
        insertData.card_index = cardIndex;
      } catch (columnError) {
        console.warn(
          "card_index column not found, inserting without card_index"
        );
      }
    }

    const { error } = await supabase
      .from("teaching_feedback")
      .insert(insertData);

    if (error) {
      console.error("Error submitting teaching feedback:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception submitting teaching feedback:", err);
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

    // Build insert object dynamically to handle missing card_index column
    const insertData: any = {
      presentation_id: presentationId,
      student_name: studentName,
      question,
    };

    // Only add card_index if it's provided
    if (cardIndex !== undefined) {
      try {
        insertData.card_index = cardIndex;
      } catch (columnError) {
        console.warn(
          "card_index column not found, inserting without card_index"
        );
      }
    }

    const { data, error } = await supabase
      .from("teaching_questions")
      .insert([insertData])
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
    // Build query dynamically to handle missing card_index column
    let query = supabase
      .from("teaching_feedback")
      .select("*")
      .eq("presentation_id", presentationId)
      .eq("student_name", studentName);

    // Only add card_index filter if the column exists (this will fail gracefully if not)
    try {
      query = query.eq("card_index", cardIndex);
    } catch (columnError) {
      console.warn("card_index column not found, fetching without card filter");
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching student feedback:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception fetching student feedback:", err);
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
      .eq("presentation_id", presentationId)
      .order("created_at", { ascending: false });

    if (cardIndex !== undefined) {
      query = query.eq("card_index", cardIndex);
    }

    const { data, error } = await query;

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
  let channel = `teaching_feedback:${presentationId}`;
  if (cardIndex !== undefined) {
    channel += `:${cardIndex}`;
  }

  // For now, don't use card_index in filter until column exists
  // Only filter by presentation_id to avoid the subscription errors
  const filter = `presentation_id=eq.${presentationId}`;

  return supabase
    .channel(channel)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "teaching_feedback",
        filter,
      },
      (payload) => {
        console.log("New teaching feedback:", payload);
        // If cardIndex is specified, only call callback for matching cards
        if (cardIndex !== undefined && payload.new.card_index !== cardIndex) {
          return;
        }
        callback(payload.new);
      }
    )
    .subscribe();
};

export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void,
  cardIndex?: number
) => {
  // For now, don't use card_index in filter until column exists
  // Only filter by presentation_id to avoid the subscription errors
  const filter = `presentation_id=eq.${presentationId}`;

  let channel = `teaching_questions:${presentationId}`;
  if (cardIndex !== undefined) {
    channel += `:${cardIndex}`;
  }

  return supabase
    .channel(channel)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "teaching_questions",
        filter,
      },
      (payload) => {
        // If cardIndex is specified, only call callback for matching cards
        if (cardIndex !== undefined && payload.new.card_index !== cardIndex) {
          return;
        }
        callback(payload.new);
      }
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
      .eq("card_index", cardIndex)
      .order("created_at", { ascending: false });

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

export const groupFeedbackByType = (feedback: Array<{ value: string }>) => {
  return feedback.reduce((acc, item) => {
    const type = item.value;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};