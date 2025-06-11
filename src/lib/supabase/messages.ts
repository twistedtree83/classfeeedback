import { supabase } from "./client";
import type { TeacherMessage } from "./types";

export const sendTeacherMessage = async (
  presentationId: string,
  teacherName: string,
  messageContent: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("teacher_messages").insert({
      presentation_id: presentationId,
      teacher_name: teacherName,
      message: messageContent,
    });

    if (error) {
      console.error("Error sending teacher message:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception sending teacher message:", err);
    return false;
  }
};

export const getTeacherMessagesForPresentation = async (
  presentationId: string
): Promise<TeacherMessage[]> => {
  try {
    const { data, error } = await supabase
      .from("teacher_messages")
      .select("*")
      .eq("presentation_id", presentationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching teacher messages:", error);
      return [];
    }

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
  return supabase
    .channel(`teacher_messages:${presentationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "teacher_messages",
        filter: `presentation_id=eq.${presentationId}`,
      },
      (payload) => {
        console.log("New teacher message:", payload);
        callback(payload.new as TeacherMessage);
      }
    )
    .subscribe();
};
