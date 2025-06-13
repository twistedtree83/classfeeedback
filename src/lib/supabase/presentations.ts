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
  wordle_word?: string | null;
  lesson_state: boolean; // Added lesson_state field
}

export const createLessonPresentation = async (
  sessionId: string,
  sessionCode: string,
  lessonId: string,
  cards: LessonCard[],
  teacherName: string,
  wordleWord?: string | null
): Promise<LessonPresentation | null> => {
  try {
    console.log("Creating lesson presentation with wordleWord:", wordleWord);

    // CRITICAL FIX: Ensure cards are properly handled
    // Make sure cards is a valid JSON array when stored
    const cardsData = Array.isArray(cards) ? cards : [];

    // Prepare the insert data
    const insertData = {
      session_id: sessionId,
      session_code: sessionCode,
      lesson_id: lessonId,
      cards: cardsData, // This will be stored as JSONB in Postgres
      current_card_index: -1, // Start in waiting room (-1), lesson begins at index 0
      lesson_state: false, // Start with lesson not started
      active: true,
      realtime_enabled: true,
      wordle_word: wordleWord
    };

    console.log("Insert data:", insertData);

    const { data, error } = await supabase
      .from("lesson_presentations")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating lesson presentation:", error);
      console.error("Error details:", error.details, error.hint, error.message);
      return null;
    }

    console.log("Created presentation data:", data);

    // Ensure cards are properly formatted in the response
    const parsedData = {
      ...data,
      cards: Array.isArray(data.cards) ? data.cards : [],
      lesson_state: data.lesson_state || false, // Ensure lesson_state is included
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

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching lesson presentation:", error);
      return null;
    }

    // If no data found, return null gracefully
    if (!data) {
      console.log("No lesson presentation found for code:", code);
      return null;
    }

    console.log("Raw presentation data from database:", data);

    // Handle both string and object formats for cards
    const parsedData = {
      ...data,
      cards: typeof data.cards === "string" 
        ? JSON.parse(data.cards) 
        : Array.isArray(data.cards) 
          ? data.cards 
          : [],
      lesson_state: data.lesson_state || false, // Ensure lesson_state is included
    };

    console.log("Parsed presentation data:", parsedData);

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
    // Only update the card index, not the lesson state
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

// New function to update both lesson state and card index in one operation
export const updateLessonPresentation = async (
  presentationId: string,
  updates: {
    current_card_index?: number;
    lesson_state?: boolean;
    active?: boolean;
    realtime_enabled?: boolean;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("lesson_presentations")
      .update(updates)
      .eq("id", presentationId);

    if (error) {
      console.error("Error updating lesson presentation:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception updating lesson presentation:", err);
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
            cards: typeof payload.new.cards === "string"
              ? JSON.parse(payload.new.cards)
              : Array.isArray(payload.new.cards) 
                ? payload.new.cards 
                : [],
            lesson_state: payload.new.lesson_state || false, // Ensure lesson_state is included
          } as LessonPresentation;
          callback(parsedPayload);
        }
      }
    )
    .subscribe();
};