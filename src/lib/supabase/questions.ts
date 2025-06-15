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

    console.log("Teaching question submitted successfully");
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
    console.log('Marking question as answered:', questionId);
    
    const { error } = await supabase
      .from("teaching_questions")
      .update({ answered: true })
      .eq("id", questionId);

    if (error) {
      console.error("Error marking question as answered:", error);
      return false;
    }

    console.log("Question marked as answered successfully");
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
    console.log('Getting teaching questions for presentation:', presentationId);
    
    const { data, error } = await supabase
      .from("teaching_questions")
      .select("*")
      .eq("presentation_id", presentationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching teaching questions:", error);
      return [];
    }

    console.log(`Retrieved ${data?.length || 0} teaching questions`);
    return data || [];
  } catch (err) {
    console.error("Exception fetching teaching questions:", err);
    return [];
  }
};

// Completely rewritten implementation that avoids filter string problems
export const subscribeToTeachingQuestions = (
  presentationId: string,
  callback: (question: any) => void,
  cardIndex?: number
) => {
  // Generate unique channel name
  const timestamp = Date.now();
  const channelName = `teaching_questions_${presentationId}_${timestamp}`;
  
  console.log(`[Questions] Setting up subscription on channel: ${channelName}`);
  console.log(`[Questions] For presentationId: ${presentationId}, cardIndex: ${cardIndex}`);
  
  const channel = supabase.channel(channelName);
  
  // Listen for INSERT events with only presentation_id filter
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'teaching_questions',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[Questions] Received INSERT event:', payload);
      
      // If cardIndex is specified, filter in the callback
      if (cardIndex !== undefined) {
        if (payload.new && payload.new.card_index === cardIndex) {
          callback(payload.new);
        }
      } else {
        if (payload.new) {
          callback(payload.new);
        }
      }
    }
  );
  
  // Listen for UPDATE events with only presentation_id filter
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'teaching_questions',
      filter: `presentation_id=eq.${presentationId}`
    },
    (payload) => {
      console.log('[Questions] Received UPDATE event:', payload);
      
      // If cardIndex is specified, filter in the callback
      if (cardIndex !== undefined) {
        if (payload.new && payload.new.card_index === cardIndex) {
          callback(payload.new);
        }
      } else {
        if (payload.new) {
          callback(payload.new);
        }
      }
    }
  );
  
  // Subscribe and log status
  const subscription = channel.subscribe((status, err) => {
    console.log(`[Questions] Subscription status: ${status}`);
    if (err) {
      console.error('[Questions] Subscription error:', err);
    } else {
      console.log('[Questions] Subscription successfully established');
    }
  });
  
  return { unsubscribe: () => subscription.unsubscribe() };
};