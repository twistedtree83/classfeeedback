import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SendMessageModal } from '../components/SendMessageModal';
import { TeachingHeader } from '../components/teacher/TeachingHeader';
import { TeachingContentArea } from '../components/teacher/TeachingContentArea';
import { TeachingSidebar } from '../components/teacher/TeachingSidebar';
import { useTeacherPresentation } from '../hooks/useTeacherPresentation';
import { useTeacherParticipants } from '../hooks/useTeacherParticipants';
import { useTeacherFeedbackAndQuestions } from '../hooks/useTeacherFeedbackAndQuestions';
import { useTeacherMessaging } from '../hooks/useTeacherMessaging';
import { endLessonPresentation } from '../lib/supabase';

export function TeachingModePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  // State for sidebar visibility
  const [showParticipants, setShowParticipants] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Custom hooks for managing different aspects of the teaching mode
  const { 
    presentation, 
    currentCard, 
    displayedCardIndex,
    actualCardIndex,
    teacherName,
    loading, 
    error, 
    handlePrevious, 
    handleNext,
    totalCards
  } = useTeacherPresentation(code);
  
  const {
    pendingCount,
    handleApproveParticipant
  } = useTeacherParticipants(code);
  
  const {
    hasNewQuestions,
    clearHasNewQuestions
  } = useTeacherFeedbackAndQuestions(presentation?.id, actualCardIndex);
  
  const {
    showMessageModal,
    isSending,
    handleSendMessage,
    openMessageModal,
    closeMessageModal
  } = useTeacherMessaging(presentation?.id, teacherName);

  // Toggle view handlers
  const handleToggleFeedback = () => {
    setShowFeedback(!showFeedback);
    if (!showFeedback) {
      setShowParticipants(false);
      clearHasNewQuestions();
    } else {
      setShowParticipants(true);
    }
  };

  const handleToggleParticipants = () => {
    setShowParticipants(!showParticipants);
    if (!showParticipants) {
      setShowFeedback(false);
    } else {
      setShowFeedback(true);
    }
  };

  const handleEndSession = async () => {
    if (!presentation || !window.confirm('Are you sure you want to end this teaching session?')) {
      return;
    }

    const success = await endLessonPresentation(presentation.id);
    if (success) {
      // Navigate to the lesson summary page instead of planner
      navigate(`/lesson-summary/${presentation.session_code}`);
    }
  };

  // Calculate state for component props
  const isFirstCard = displayedCardIndex === 0;
  const isLastCard = presentation ? displayedCardIndex === totalCards - 1 : true;
  const progressPercentage = totalCards ? ((displayedCardIndex + 1) / totalCards) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Session not found or has ended'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TeachingHeader
        sessionCode={presentation.session_code}
        hasNewQuestions={hasNewQuestions}
        pendingCount={pendingCount}
        showFeedback={showFeedback}
        showParticipants={showParticipants}
        onToggleFeedback={handleToggleFeedback}
        onToggleParticipants={handleToggleParticipants}
        onOpenMessageModal={openMessageModal}
        onEndSession={handleEndSession}
      />

      <div className="flex-1 flex overflow-hidden">
        <main className={`flex-1 overflow-auto p-6 ${(showParticipants || showFeedback) ? 'lg:pr-0' : ''}`}>
          <TeachingContentArea
            currentCard={currentCard}
            displayedCardIndex={displayedCardIndex}
            totalCards={totalCards}
            progressPercentage={progressPercentage}
            isFirstCard={isFirstCard}
            isLastCard={isLastCard}
            onPrevious={handlePrevious}
            onNext={handleNext}
            sessionCode={presentation.session_code}
          />
        </main>

        {(showParticipants || showFeedback) && (
          <TeachingSidebar
            showParticipants={showParticipants}
            showFeedback={showFeedback}
            sessionCode={presentation.session_code}
            presentationId={presentation.id}
            currentCardIndex={actualCardIndex}
          />
        )}
      </div>

      <SendMessageModal
        isOpen={showMessageModal}
        onClose={closeMessageModal}
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />
    </div>
  );
}