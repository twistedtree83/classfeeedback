import { supabase } from "./client";

export const submitTeachingQuestion = async (
  presentationId: string,
  studentName: string,
  question: string,
  cardIndex?: number
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("teaching_questions").insert({
      presentation_id: presentationId,
      student_name: studentName,
      question,
      card_index: cardIndex ?? null,
      answered: false,
    });

    if (error) {
      console.error("Error submitting teaching question:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception submitting teaching question:", err);
    return false;
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

    if (error) {
      console.error("Error marking question as answered:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception marking question as answered:", err);
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

export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void,
  cardIndex?: number
) => {
  let channel = `teaching_questions:${presentationId}`;
  if (cardIndex !== undefined) {
    channel += `:${cardIndex}`;
  }

  let filter = `presentation_id=eq.${presentationId}`;
  if (cardIndex !== undefined) {
    filter += `,card_index=eq.${cardIndex}`;
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
        console.log("New teaching question:", payload);
        callback(payload.new);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "teaching_questions",
        filter,
      },
      (payload) => {
        console.log("Updated teaching question:", payload);
        callback(payload.new);
      }
    )
    .subscribe();
};
