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
        isDifferentiated: card.isDifferentiated || false
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
      current_card_index: 0,
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
    
    const { data: session, error: sessionError } = await sessionQuery.single();

    if (sessionError) {
      console.error('Session not found or inactive:', sessionError);
      return null;
    }

    console.log('Found active session:', JSON.stringify(session, null, 2));

    // Now get the presentation
    const presentationQuery = supabase
      .from('lesson_presentations')
      .select('*')
      .eq('session_code', code);
    
    // Only filter by active status if we're not including inactive sessions
    if (!includeInactive) {
      presentationQuery.eq('active', true);
    }
    
    const { data, error } = await presentationQuery.single();
    
    if (error || !data) {
      console.error('Error fetching presentation:', error);
      return null;
    }
    
    console.log('Retrieved presentation data:', JSON.stringify(data, null, 2));
    
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
    const { error } = await supabase
      .from('lesson_presentations')
      .update({ current_card_index: newIndex })
      .eq('id', presentationId);
    
    if (error) throw error;
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
  return supabase
    .channel('lesson_presentations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lesson_presentations',
        filter: `session_code=eq.${code}`,
      },
      (payload) => callback(payload.new as LessonPresentation)
    )
    .subscribe();
};