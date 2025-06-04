import { useState, useEffect, useCallback } from 'react';
import { 
  getLessonPresentationByCode, 
  updateLessonPresentationCardIndex,
  getSessionByCode, 
  getLessonPlanById, 
  LessonPresentation, 
  LessonCard 
} from '../lib/supabase';

export function useTeacherPresentation(code: string | undefined) {
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<LessonCard | null>(null);
  const [displayedCardIndex, setDisplayedCardIndex] = useState(0);
  const [actualCardIndex, setActualCardIndex] = useState(-1); // Initialize as -1 to match database
  const [teacherName, setTeacherName] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateInProgress, setUpdateInProgress] = useState(false);

  // Load the presentation on mount
  useEffect(() => {
    const loadPresentation = async () => {
      if (!code) return;

      try {
        // Get session data
        const sessionData = await getSessionByCode(code);
        if (!sessionData) throw new Error('Session not found');

        // Set teacher name
        if (sessionData) {
          setTeacherName(sessionData.teacher_name);
        }

        // Get presentation data
        const presentationData = await getLessonPresentationByCode(code);
        if (!presentationData) throw new Error('Presentation not found');

        // Get lesson data to get the title
        if (presentationData.lesson_id) {
          const lessonData = await getLessonPlanById(presentationData.lesson_id);
          if (lessonData && lessonData.processed_content) {
            setLessonTitle(lessonData.processed_content.title || '');
          }
        }

        // Set presentation data
        setPresentation(presentationData);
        
        // Default to displaying the welcome card (index 0 in our UI logic)
        setDisplayedCardIndex(0);
        
        // Store the actual database index (-1 at first, will be 0 after first "Next")
        setActualCardIndex(presentationData.current_card_index);
        
        // Set current card
        updateCurrentCardDisplay(presentationData, 0);
      } catch (err) {
        console.error('Error loading presentation or session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    loadPresentation();
  }, [code]);

  // Create a welcome card that shows the lesson title
  const createWelcomeCard = (): LessonCard => {
    return {
      id: 'welcome-card',
      type: 'custom',
      title: `Welcome to: ${lessonTitle || 'Your Lesson'}`,
      content: `
## ${lessonTitle || 'Lesson Presentation'}

This is the welcome screen for your lesson. Students can join using the code: **${code}**

Click "Ready to Go" to begin your lesson presentation.
      `,
      duration: null,
      sectionId: null,
      activityIndex: null,
      attachments: []
    };
  };

  // Update the current card based on displayedCardIndex
  const updateCurrentCardDisplay = (presentationData: LessonPresentation, index: number) => {
    if (index === 0) {
      // Show welcome card
      setCurrentCard(createWelcomeCard());
    } else {
      // Adjust index to account for welcome card
      const adjustedIndex = index - 1;
      if (presentationData.cards && adjustedIndex >= 0 && adjustedIndex < presentationData.cards.length) {
        setCurrentCard(presentationData.cards[adjustedIndex]);
      }
    }
  };

  const handlePrevious = async () => {
    if (!presentation || displayedCardIndex <= 0 || updateInProgress) return;

    setUpdateInProgress(true);
    const newDisplayIndex = displayedCardIndex - 1;
    setDisplayedCardIndex(newDisplayIndex);

    // Only update database card index if we're moving between actual content cards
    if (newDisplayIndex > 0) {
      const newActualIndex = newDisplayIndex - 1;
      setActualCardIndex(newActualIndex);
      
      try {
        console.log(`Navigating from card ${actualCardIndex} to ${newActualIndex}`);
        const success = await updateLessonPresentationCardIndex(presentation.id, newActualIndex);
        
        if (!success) {
          console.error('Failed to update card index');
        }
      } catch (err) {
        console.error('Error updating card index:', err);
      }
    } else if (newDisplayIndex === 0) {
      // We're going back to the welcome card (which is purely local to the teacher)
      // Update database to -1 to indicate we're at the welcome card
      try {
        console.log(`Teacher going to welcome card, setting database to card -1`);
        const success = await updateLessonPresentationCardIndex(presentation.id, -1);
        
        if (!success) {
          console.error('Failed to update card index');
        }
        setActualCardIndex(-1);
      } catch (err) {
        console.error('Error updating card index:', err);
      }
    }

    updateCurrentCardDisplay(presentation, newDisplayIndex);
    setUpdateInProgress(false);
  };

  const handleNext = async () => {
    if (!presentation || updateInProgress) return;
    
    // Calculate max index (adding 1 for welcome card)
    const maxIndex = presentation.cards.length;
    
    if (displayedCardIndex >= maxIndex) return;

    setUpdateInProgress(true);
    const newDisplayIndex = displayedCardIndex + 1;
    setDisplayedCardIndex(newDisplayIndex);

    // Get the new database index (adjusted for the welcome card)
    const newActualIndex = newDisplayIndex - 1;
    setActualCardIndex(newActualIndex);
    
    // Always update the database when moving forward, even from welcome card
    try {
      console.log(`Navigating from card ${actualCardIndex} to ${newActualIndex}`);
      const success = await updateLessonPresentationCardIndex(presentation.id, newActualIndex);
      
      if (!success) {
        console.error('Failed to update card index in database');
      }
    } catch (err) {
      console.error('Error updating card index:', err);
    }

    updateCurrentCardDisplay(presentation, newDisplayIndex);
    setUpdateInProgress(false);
  };

  // Update welcome card when necessary data changes
  useEffect(() => {
    if (displayedCardIndex === 0 && presentation) {
      updateCurrentCardDisplay(presentation, 0);
    }
  }, [lessonTitle, code, displayedCardIndex, presentation]);

  return {
    presentation,
    currentCard,
    displayedCardIndex,
    actualCardIndex,
    teacherName,
    lessonTitle,
    loading,
    error,
    setError,
    handlePrevious,
    handleNext,
    totalCards: presentation ? presentation.cards.length + 1 : 0 // Add 1 for welcome card
  };
}