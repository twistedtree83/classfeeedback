import { supabase } from './client';

export const submitTeachingQuestion = async (
  presentationId: string,
  studentName: string,
  question: string,
  cardIndex?: number
): Promise<boolean> => {
  try {
    console.log('Submitting teaching question:', {
      presentation_id: presentationId,
      student_name: studentName,
      question,
      card_index: cardIndex
    });
    
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

// FIXED IMPLEMENTATION - correct handling of cardIndex filter
export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void,
  cardIndex?: number
) => {
  // Create a unique channel name with timestamp to avoid conflicts
  const timestamp = Date.now();
  const channelName = `teaching_questions_${presentationId}_${cardIndex !== undefined ? cardIndex : 'all'}_${timestamp}`;
  
  console.log(`Setting up teaching questions subscription on channel: ${channelName}`);
  console.log(`Parameters: presentationId=${presentationId}, cardIndex=${cardIndex}`);
  
  if (cardIndex !== undefined) {
    // For subscriptions with card index filter - handle in callback
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'teaching_questions',
          filter: `presentation_id=eq.${presentationId}`
        },
        (payload) => {
          console.log("New teaching question event received:", payload);
          // Only process if it matches our card index
          if (payload.new && payload.new.card_index === cardIndex) {
            callback(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teaching_questions',
          filter: `presentation_id=eq.${presentationId}`
        },
        (payload) => {
          console.log("Updated teaching question event received:", payload);
          // Only process if it matches our card index
          if (payload.new && payload.new.card_index === cardIndex) {
            callback(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Teaching questions subscription status: ${status}`);
      });

    return subscription;
  } else {
    // For subscriptions without card index filter
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'teaching_questions',
          filter: `presentation_id=eq.${presentationId}`
        },
        (payload) => {
          console.log("New teaching question:", payload);
          callback(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teaching_questions',
          filter: `presentation_id=eq.${presentationId}`
        },
        (payload) => {
          console.log("Updated teaching question:", payload);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Teaching questions subscription status: ${status}`);
      });

    return subscription;
  }
};