import { supabase } from "./client";
import type { ProcessedLesson } from "../types";

export interface LessonPlan {
  id: string;
  title: string;
  processed_content: ProcessedLesson | null;
  created_at: string;
  level?: string;
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

export const getLessonPlans = async (): Promise<LessonPlan[]> => {
  try {
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lesson plans:", error);
      return [];
    }

    return data.filter((lesson) => lesson.processed_content !== null) || [];
  } catch (err) {
    console.error("Exception fetching lesson plans:", err);
    return [];
  }
};

export const createLessonPlan = async (
  title: string,
  processedContent: any,
  level?: string,
  userId?: string
): Promise<LessonPlan | null> => {
  try {
    const { data, error } = await supabase
      .from("lesson_plans")
      .insert([
        {
          title,
          processed_content: processedContent,
          level,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating lesson plan:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception creating lesson plan:", err);
    return null;
  }
};

export const updateLessonPlan = async (
  id: string,
  updates: Partial<LessonPlan>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("lesson_plans")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating lesson plan:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception updating lesson plan:", err);
    return false;
  }
};

export const deleteLessonPlan = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("lesson_plans").delete().eq("id", id);

    if (error) {
      console.error("Error deleting lesson plan:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception deleting lesson plan:", err);
    return false;
  }
};

export const subscribeLessonPlans = (callback: (payload: any) => void) => {
  return supabase
    .channel("lesson_plans")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "lesson_plans",
      },
      (payload) => callback(payload)
    )
    .subscribe();
};
