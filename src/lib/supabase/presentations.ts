import { supabase } from './client';
import type { LessonPresentation } from './types';
import { v4 as uuidv4 } from 'uuid';

export const createLessonPresentation = async (
  lessonId: string,
  cards: any[],
  teacherName: string
): Promise<LessonPresentation | null> => {
  let code: string;
  
  try {
    // Validate cards structure
    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error('Invalid cards data');
    }

    // Validate each card has required properties
    const validCards = cards.map(card => {
      if (!card.id || !card.type || !card.title || !card.content) {
        throw new Error('Each card must have id, type, title, and content');
      }
      
      if (!['objective', 'material', 'section', 'activity', 'custom', 'topic_background'].includes(card.type)) {
        throw new Error(`Invalid card type: ${card.type}`);
      }
      
      return {
        id: card.id,
        type: card.type,
        title: String(card.title),
        content: String(card.content),
        duration: card.duration || null,
        sectionId: typeof card.sectionId === 'string' ? card.sectionId : null,
        activityIndex: typeof card.activityIndex === 'number' ? card.activityIndex : null,
        studentFriendly: card.studentFriendly || false,
        originalContent: card.originalContent || null,
        differentiatedContent: card.differentiatedContent || null,
        isDifferentiated: card.isDifferentiated || false,
        attachments: card.attachments || []
      };
    });

    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // First create a session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        code,
        teacher_name: teacherName,
        active: true
      }])
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
      active: true
    };

    const { data, error } = await supabase
      .from('lesson_presentations')
      .insert([presentationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating lesson presentation:', err);
    // Clean up session if presentation creation fails
    if (code) {
      await supabase
        .from('sessions')
        .delete()
        .eq('code', code);
    }
    return null;
  }
};

export const getLessonPresentationByCode = async (
  code: string,
  includeInactive: boolean = false
): Promise<LessonPresentation | null> => {
  try {
    console.log('Requesting presentation for code:', code);
    
    // First check if session exists
    const sessionQuery = supabase
      .from('sessions')
      .select('*')
      .eq('code', code);
    
    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      sessionQuery.eq('active', true);
    }
    
    const { data: session, error: sessionError } = await sessionQuery.maybeSingle();

    if (sessionError) {
      console.error('Error finding session:', sessionError);
      return null;
    }
    
    if (!session) {
      console.log('No session found with code:', code);
      return null;
    }

    console.log('Found session:', JSON.stringify(session, null, 2));

    // Now get the presentation
    const presentationQuery = supabase
      .from('lesson_presentations')
      .select('*')
      .eq('session_code', code);
    
    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      presentationQuery.eq('active', true);
    }
    
    const { data, error } = await presentationQuery.maybeSingle();
    
    if (error) {
      console.error('Error fetching presentation:', error);
      return null;
    }
    
    if (!data) {
      console.log('No presentation found with code:', code);
      return null;
    }
    
    console.log('Retrieved presentation data:', JSON.stringify({
      id: data.id,
      session_code: data.session_code,
      current_card_index: data.current_card_index,
      cards_count: Array.isArray(data.cards) ? data.cards.length : 'N/A'
    }));
    
    // Supabase automatically handles JSONB
    return data;
  } catch (err) {
    console.error('Error fetching lesson presentation:', err);
    return null;
  }
};

export const updateLessonPresentationCardIndex = async (
  presentationId: string,
  newIndex: number
): Promise<boolean> => {
  try {
    console.log(`Updating presentation ${presentationId} card index to ${newIndex}`);
    const { error } = await supabase
      .from('lesson_presentations')
      .update({ current_card_index: newIndex })
      .eq('id', presentationId);
    
    if (error) {
      console.error('Error updating card index:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating card index:', err);
    return false;
  }
};

export const endLessonPresentation = async (
  presentationId: string
): Promise<boolean> => {
  try {
    // Get the presentation first to get the session code
    const { data: presentation, error: fetchError } = await supabase
      .from('lesson_presentations')
      .select('session_code')
      .eq('id', presentationId)
      .single();

    if (fetchError) throw fetchError;

    // End both the presentation and its associated session
    const { error: presentationError } = await supabase
      .from('lesson_presentations')
      .update({ active: false })
      .eq('id', presentationId);

    if (presentationError) throw presentationError;

    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ active: false })
      .eq('code', presentation.session_code);
    
    if (sessionError) throw sessionError;

    return true;
  } catch (err) {
    console.error('Error ending presentation:', err);
    return false;
  }
};

export const subscribeToLessonPresentation = (
  code: string,
  callback: (payload: LessonPresentation) => void
) => {
  console.log(`Setting up real-time subscription for presentation with code: ${code}`);
  
  const channel = supabase
    .channel(`presentation_${code}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'lesson_presentations',
        filter: `session_code=eq.${code}`,
      },
      (payload) => {
        console.log(`Received update for presentation ${code}:`, payload.new);
        callback(payload.new as LessonPresentation);
      }
    )
    .subscribe((status) => {
      console.log(`Presentation subscription status for ${code}:`, status);
    });
    
  return {
    unsubscribe: () => {
      console.log(`Unsubscribing from presentation ${code}`);
      channel.unsubscribe();
    }
  };
};