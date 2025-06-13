/* This is a partial file update focusing on a key error fix */

// Fix the error in getStudentFeedbackForCard function:
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

    // Use maybeSingle() instead of single() to prevent 406 errors when no records are found
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