import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SendMessageModal } from "../components/SendMessageModal";
import { TeachingHeader } from "../components/teacher/TeachingHeader";
import { TeachingContentArea } from "../components/teacher/TeachingContentArea";
import { TeacherSidebar } from "../components/TeacherSidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { useTeacherPresentation } from "../hooks/useTeacherPresentation";
import { useTeacherParticipants } from "../hooks/useTeacherParticipants";
import { useTeacherFeedbackAndQuestions } from "../hooks/useTeacherFeedbackAndQuestions";
import { useTeacherMessaging } from "../hooks/useTeacherMessaging";
import { endLessonPresentation } from "../lib/supabase";
import { RemedialAssignmentModal } from "@/components/teacher/RemedialAssignmentModal";

export function TeachingModePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  // State for sidebar visibility
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRemedialModal, setShowRemedialModal] = useState(false);

  // Custom hooks for managing different aspects of the teaching mode
  const {
    presentation,
    currentCard,
    displayedCardIndex,
    actualCardIndex,
    teacherName,
    lessonTitle,
    loading,
    error,
    handlePrevious,
    handleNext,
    totalCards,
  } = useTeacherPresentation(code);

  const {
    pendingCount,
    pendingParticipants,
    handleApproveParticipant,
    handleRejectParticipant,
  } = useTeacherParticipants(code);

  const { 
    hasNewQuestions, 
    hasNewExtensionRequests,
    clearHasNewQuestions,
    clearHasNewExtensionRequests,
    pendingExtensionRequests,
    handleApproveExtension,
    handleRejectExtension
  } = useTeacherFeedbackAndQuestions(presentation?.id, actualCardIndex);

  const {
    showMessageModal,
    isSending,
    handleSendMessage,
    openMessageModal,
    closeMessageModal,
  } = useTeacherMessaging(presentation?.id, teacherName);

  // Add console logging for debugging
  useEffect(() => {
    console.log("[TeachingModePage] Current state:", {
      presentationId: presentation?.id,
      currentCardIndex: actualCardIndex,
      hasNewQuestions,
      hasNewExtensionRequests,
      pendingCount,
      pendingExtensionRequests: pendingExtensionRequests?.length
    });
  }, [
    presentation?.id,
    actualCardIndex,
    hasNewQuestions,
    hasNewExtensionRequests,
    pendingCount,
    pendingExtensionRequests
  ]);

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleEndSession = async () => {
    if (
      !presentation ||
      !window.confirm("Are you sure you want to end this teaching session?")
    ) {
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
  const isLastCard = presentation
    ? displayedCardIndex === totalCards - 1
    : true;
  const progressPercentage = totalCards
    ? ((displayedCardIndex + 1) / totalCards) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red/10 text-red p-4 rounded-lg border border-red/20">
          {error || "Session not found or has ended"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white flex flex-col h-screen overflow-hidden">
      <TeachingHeader
        sessionCode={presentation.session_code}
        lessonTitle={lessonTitle}
        hasNewQuestions={hasNewQuestions}
        hasNewExtensionRequests={hasNewExtensionRequests}
        pendingCount={pendingCount}
        showSidebar={showSidebar}
        onToggleSidebar={handleToggleSidebar}
        onOpenMessageModal={openMessageModal}
        onOpenRemedialModal={() => setShowRemedialModal(true)}
        onEndSession={handleEndSession}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={showSidebar} setOpen={setShowSidebar}>
          <TeacherSidebar
            sessionCode={presentation.session_code}
            presentationId={presentation.id}
            teacherName={teacherName}
            pendingCount={pendingCount}
            hasNewQuestions={hasNewQuestions}
            hasNewExtensionRequests={hasNewExtensionRequests}
            currentCardIndex={actualCardIndex}
            onEndSession={handleEndSession}
          />
        </Sidebar>

        <main className="flex-1 overflow-auto p-6">
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
            pendingParticipants={pendingParticipants}
            pendingExtensionRequests={pendingExtensionRequests}
            onApproveParticipant={handleApproveParticipant}
            onRejectParticipant={handleRejectParticipant}
            onApproveExtension={handleApproveExtension}
            onRejectExtension={handleRejectExtension}
          />
        </main>
      </div>

      <SendMessageModal
        isOpen={showMessageModal}
        onClose={closeMessageModal}
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />

      <RemedialAssignmentModal
        isOpen={showRemedialModal}
        onClose={() => setShowRemedialModal(false)}
        presentation={presentation}
        sessionCode={presentation.session_code}
      />
    </div>
  );
}