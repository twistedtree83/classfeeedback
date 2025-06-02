import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, BarChart3, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ParticipantsList } from '../components/ParticipantsList';
import { TeachingFeedbackPanel } from '../components/TeachingFeedbackPanel';
import { SendMessageModal } from '../components/SendMessageModal';
import {
  getLessonPresentationByCode,
  updateLessonPresentationCardIndex,
  endLessonPresentation,
  subscribeToTeachingQuestions,
  getSessionByCode,
  sendTeacherMessage,
  getParticipantsForSession,
  subscribeToSessionParticipants,
  SessionParticipant,
  getLessonPlanById
} from '../lib/supabaseClient';
import type { LessonPresentation, LessonCard, ProcessedLesson } from '../lib/types';
import { sanitizeHtml } from '../lib/utils';

export function TeachingModePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<LessonCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [teacherName, setTeacherName] = useState<string>('');
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [displayedCardIndex, setDisplayedCardIndex] = useState<number>(0);
  const [actualCardIndex, setActualCardIndex] = useState<number>(0);

  useEffect(() => {
    const loadPresentationAndSession = async () => {
      if (!code) return;

      try {
        // Get presentation data
        const presentationData = await getLessonPresentationByCode(code);
        if (!presentationData) throw new Error('Presentation not found');

        // Get session data
        const sessionData = await getSessionByCode(code);
        if (sessionData) {
          setTeacherName(sessionData.teacher_name);
        }

        // Get lesson data to get the title
        if (presentationData.lesson_id) {
          const lessonData = await getLessonPlanById(presentationData.lesson_id);
          if (lessonData && lessonData.processed_content) {
            setLessonTitle(lessonData.processed_content.title);
          }
        }

        // Load initial participants
        const participantsData = await getParticipantsForSession(code);
        setParticipants(participantsData);

        // Set presentation data
        setPresentation(presentationData);
        
        // Default to displaying the welcome card (index -1 in our UI logic)
        setDisplayedCardIndex(0);
        setActualCardIndex(presentationData.current_card_index);
        
        // Set current card based on the welcome card status
        updateCurrentCardDisplay(presentationData, 0, participantsData);
      } catch (err) {
        console.error('Error loading presentation or session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    loadPresentationAndSession();
  }, [code]);

  // Subscribe to session participants
  useEffect(() => {
    if (!code) return;

    const subscription = subscribeToSessionParticipants(
      code,
      (newParticipant) => {
        console.log("New participant joined:", newParticipant);
        setParticipants(prev => [...prev, newParticipant]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [code]);

  // Update welcome card when participants change
  useEffect(() => {
    if (displayedCardIndex === 0 && presentation) {
      updateCurrentCardDisplay(presentation, 0, participants);
    }
  }, [participants, displayedCardIndex, presentation]);

  useEffect(() => {
    if (!presentation?.id) return;

    const subscription = subscribeToTeachingQuestions(
      presentation.id,
      (newQuestion) => {
        if (!showFeedback) {
          setHasNewQuestions(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [presentation?.id, showFeedback]);

  useEffect(() => {
    if (showFeedback) {
      setHasNewQuestions(false);
    }
  }, [showFeedback]);

  // Create a welcome card that shows the lesson title and participants
  const createWelcomeCard = (participantsList: SessionParticipant[]): LessonCard => {
    const participantsContent = participantsList.length > 0 
      ? participantsList.map(p => `- ${p.student_name} (joined at ${new Date(p.joined_at).toLocaleTimeString()})`).join('\n')
      : 'No students have joined yet.';

    return {
      id: 'welcome-card',
      type: 'custom',
      title: `Welcome to: ${lessonTitle}`,
      content: `
## ${lessonTitle || 'Lesson Presentation'}

This is the welcome screen for your lesson. Students can join using the code: **${code}**

### Students who have joined:
${participantsContent}

Click "Next" to begin your lesson presentation.
      `,
      duration: null,
      sectionId: null,
      activityIndex: null
    };
  };

  // Update the current card based on displayedCardIndex
  const updateCurrentCardDisplay = (presentationData: LessonPresentation, index: number, participantsList: SessionParticipant[] = participants) => {
    if (index === 0) {
      // Show welcome card
      setCurrentCard(createWelcomeCard(participantsList));
    } else {
      // Adjust index to account for welcome card
      const adjustedIndex = index - 1;
      if (presentationData.cards && adjustedIndex >= 0 && adjustedIndex < presentationData.cards.length) {
        setCurrentCard(presentationData.cards[adjustedIndex]);
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!presentation?.id || !teacherName) return false;
    setIsSendingMessage(true);
    try {
      const success = await sendTeacherMessage(presentation.id, teacherName, message);
      if (!success) {
        setError('Failed to send message.');
      }
      return success;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An unexpected error occurred while sending message.');
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handlePrevious = async () => {
    if (!presentation || displayedCardIndex <= 0) return;

    const newDisplayIndex = displayedCardIndex - 1;
    setDisplayedCardIndex(newDisplayIndex);

    // Only update database card index if we're moving between actual content cards
    if (newDisplayIndex > 0) {
      const newActualIndex = newDisplayIndex - 1;
      setActualCardIndex(newActualIndex);
      const success = await updateLessonPresentationCardIndex(presentation.id, newActualIndex);
      
      if (!success) {
        console.error('Failed to update card index');
      }
    }

    updateCurrentCardDisplay(presentation, newDisplayIndex);
  };

  const handleNext = async () => {
    if (!presentation) return;
    
    // Calculate max index (adding 1 for welcome card)
    const maxIndex = presentation.cards.length + 1;
    
    if (displayedCardIndex >= maxIndex - 1) return;

    const newDisplayIndex = displayedCardIndex + 1;
    setDisplayedCardIndex(newDisplayIndex);

    // Only update database card index if we're moving between actual content cards
    if (newDisplayIndex > 0) {
      const newActualIndex = newDisplayIndex - 1;
      setActualCardIndex(newActualIndex);
      const success = await updateLessonPresentationCardIndex(presentation.id, newActualIndex);
      
      if (!success) {
        console.error('Failed to update card index');
      }
    }

    updateCurrentCardDisplay(presentation, newDisplayIndex);
  };

  const handleEndSession = async () => {
    if (!presentation || !window.confirm('Are you sure you want to end this teaching session?')) {
      return;
    }

    const success = await endLessonPresentation(presentation.id);
    if (success) {
      navigate('/planner');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !presentation || !currentCard) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Session not found or has ended'}
        </div>
      </div>
    );
  }

  // Calculate progress based on displayedCardIndex
  const totalCards = presentation.cards.length + 1; // +1 for welcome card
  const progressPercentage = ((displayedCardIndex + 1) / totalCards) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Teaching Mode
              </h1>
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md font-mono ml-4">
                {presentation.session_code}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={showFeedback ? "primary" : "outline"}
                onClick={() => setShowFeedback(!showFeedback)}
                size="sm"
                className="relative"
              >
                <BarChart3 className="h-5 w-5" />
                {hasNewQuestions && !showFeedback && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
              <Button
                variant={showParticipants ? "primary" : "outline"}
                onClick={() => setShowParticipants(!showParticipants)}
                size="sm"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSendMessageModal(true)}
                size="sm"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={handleEndSession}
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main className={`flex-1 overflow-auto p-6 ${(showParticipants || showFeedback) ? 'lg:pr-0' : ''}`}>
          <div className="max-w-4xl mx-auto">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            {/* Card container */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              {/* Card header */}
              <div className="border-b border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentCard.title}
                </h2>
                {currentCard.duration && (
                  <p className="text-gray-500 mt-1">{currentCard.duration}</p>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  Card {displayedCardIndex + 1} of {totalCards}
                </div>
              </div>

              {/* Card content */}
              <div className="p-6">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(currentCard.content) 
                }}></div>
              </div>

              {/* Card navigation */}
              <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-between items-center">
                <Button
                  onClick={handlePrevious}
                  disabled={displayedCardIndex === 0}
                  variant="outline"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>
                <span className="text-gray-500">
                  {displayedCardIndex + 1} / {totalCards}
                </span>
                <Button
                  onClick={handleNext}
                  disabled={displayedCardIndex === totalCards - 1}
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Student join instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <h3 className="font-bold mb-2">Student Join Instructions</h3>
              <p>
                Students can join this session by visiting{' '}
                <span className="font-medium">/student?code={presentation.session_code}</span>{' '}
                or by entering the code: <strong>{presentation.session_code}</strong>
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        {(showParticipants || showFeedback) && (
          <aside className="hidden lg:block w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 space-y-6">
              {showFeedback && (
                <TeachingFeedbackPanel presentationId={presentation.id} />
              )}

              {showParticipants && (
                <ParticipantsList sessionCode={presentation.session_code} />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={showSendMessageModal}
        onClose={() => setShowSendMessageModal(false)}
        onSendMessage={handleSendMessage}
        isSending={isSendingMessage}
      />
    </div>
  );
}