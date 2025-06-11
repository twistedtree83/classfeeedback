import { supabase } from "./client";
import type { LessonCard } from "../types";

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

export const createLessonPresentation = async (
  sessionId: string,
  sessionCode: string,
  lessonId: string,
  cards: LessonCard[],
  teacherName: string
): Promise<LessonPresentation | null> => {
  try {
    const { data, error } = await supabase
      .from("lesson_presentations")
      .insert({
        session_id: sessionId,
        session_code: sessionCode,
        lesson_id: lessonId,
        cards: JSON.stringify(cards),
        current_card_index: 0,
        active: true,
        realtime_enabled: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating lesson presentation:", error);
      return null;
    }

    // Parse the cards back to objects
    const parsedData = {
      ...data,
      cards:
        typeof data.cards === "string" ? JSON.parse(data.cards) : data.cards,
    };

    return parsedData;
  } catch (err) {
    console.error("Exception creating lesson presentation:", err);
    return null;
  }
};

export const getLessonPresentationByCode = async (
  code: string,
  includeInactive: boolean = false
): Promise<LessonPresentation | null> => {
  try {
    let query = supabase
      .from("lesson_presentations")
      .select("*")
      .eq("session_code", code);

    if (!includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error("Error fetching lesson presentation:", error);
      return null;
    }

    // Parse the cards from JSON string to array
    const parsedData = {
      ...data,
      cards:
        typeof data.cards === "string" ? JSON.parse(data.cards) : data.cards,
    };

    return parsedData;
  } catch (err) {
    console.error("Exception fetching lesson presentation:", err);
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

    if (error) {
      console.error("Error updating card index:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception updating card index:", err);
    return false;
  }
};

export const endLessonPresentation = async (
  presentationId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("lesson_presentations")
      .update({
        active: false,
        realtime_enabled: false,
      })
      .eq("id", presentationId);

    if (error) {
      console.error("Error ending lesson presentation:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception ending lesson presentation:", err);
    return false;
  }
};

export const subscribeToLessonPresentation = (
  code: string,
  callback: (payload: LessonPresentation) => void
) => {
  return supabase
    .channel(`lesson_presentation:${code}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "lesson_presentations",
        filter: `session_code=eq.${code}`,
      },
      (payload) => {
        console.log("Lesson presentation update:", payload);
        if (payload.new) {
          const parsedPayload = {
            ...payload.new,
            cards:
              typeof payload.new.cards === "string"
                ? JSON.parse(payload.new.cards)
                : payload.new.cards,
          } as LessonPresentation;
          callback(parsedPayload);
        }
      }
    )
    .subscribe();
};
