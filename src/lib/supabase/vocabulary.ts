import { supabase } from './client';
import type { VocabularyTerm } from './types';

// Save vocabulary terms for a lesson
export const saveVocabularyTerms = async (
  lessonId: string,
  terms: Array<{ word: string; definition: string }>
): Promise<boolean> => {
  try {
    if (!terms.length) return true;
    
    const termData = terms.map(term => ({
      lesson_id: lessonId,
      word: term.word,
      definition: term.definition
    }));
    
    const { error } = await supabase
      .from('vocabulary_terms')
      .insert(termData);
      
    if (error) {
      console.error('Error saving vocabulary terms:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception saving vocabulary terms:', err);
    return false;
  }
};

// Get vocabulary terms for a specific lesson
export const getVocabularyTermsForLesson = async (
  lessonId: string
): Promise<VocabularyTerm[]> => {
  try {
    if (!lessonId) return [];
    
    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('word');
      
    if (error) {
      console.error('Error fetching vocabulary terms:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception fetching vocabulary terms:', err);
    return [];
  }
};

// Delete vocabulary terms for a lesson
export const deleteVocabularyTermsForLesson = async (
  lessonId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vocabulary_terms')
      .delete()
      .eq('lesson_id', lessonId);
      
    if (error) {
      console.error('Error deleting vocabulary terms:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception deleting vocabulary terms:', err);
    return false;
  }
};

// Get vocabulary term by ID
export const getVocabularyTermById = async (
  termId: string
): Promise<VocabularyTerm | null> => {
  try {
    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select('*')
      .eq('id', termId)
      .single();
      
    if (error) {
      console.error('Error fetching vocabulary term:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception fetching vocabulary term:', err);
    return null;
  }
};