import React, { useState, useEffect } from "react";
import { MessagePanel } from "../MessagePanel";
import { StudentHeader } from "./StudentHeader";
import { LessonContentDisplay } from "./LessonContentDisplay";
import { StudentInteractionPanel } from "./StudentInteractionPanel";
import { WaitingRoom } from "./WaitingRoom";
import { CheckCircle2 } from "lucide-react";
import type { LessonCard, TeacherMessage, CardAttachment } from "@/lib/types";
import type { LessonPresentation } from "@/lib/supabase/presentations";
import { StudentFeedbackPanel } from "./StudentFeedbackPanel";

interface StudentContentProps {
  studentName: string;
  sessionCode: string;
  avatarUrl: string;
  teacherName: string;
  currentCard: LessonCard | null;
  currentCardAttachments: CardAttachment[];
  messages: TeacherMessage[];
  newMessageCount: number;
  showMessagePanel: boolean;
  viewingDifferentiated: boolean;
  generatingDifferentiated: boolean;
  successMessage: string | null;
  lessonStarted: boolean;
  currentFeedback: string | null;
  isSending: boolean;
  presentation?: LessonPresentation | null;
  onToggleMessagePanel: () => void;
  onToggleDifferentiatedView: () => void;
  onGenerateDifferentiated: () => Promise<void>;
  onSendFeedback: (type: string) => Promise<void>;
  onSendQuestion: (question: string) => Promise<boolean>;
}

export function StudentContent({
  studentName,
  sessionCode,
  avatarUrl,
  teacherName,
  currentCard,
  currentCardAttachments,
  messages,
  newMessageCount,
  showMessagePanel,
  viewingDifferentiated,
  generatingDifferentiated,
  successMessage,
  lessonStarted,
  currentFeedback,
  isSending,
  presentation,
  onToggleMessagePanel,
  onToggleDifferentiatedView,
  onGenerateDifferentiated,
  onSendFeedback,
  onSendQuestion,
}: StudentContentProps) {
  const [extensionRequested, setExtensionRequested] = useState(false);
  const [extensionPending, setExtensionPending] = useState(false);
  const [extensionApproved, setExtensionApproved] = useState(false);
  const [hasExtensionActivity, setHasExtensionActivity] = useState(false);
  
  // Check if current card has an extension activity
  useEffect(() => {
    if (currentCard) {
      setHasExtensionActivity(!!currentCard.extensionActivity);
      // Reset extension states when changing cards
      setExtensionRequested(false);
      setExtensionPending(false);
      setExtensionApproved(false);
    } else {
      setHasExtensionActivity(false);
    }
  }, [currentCard]);

  // Handle extension activity request
  const handleExtensionRequest = async () => {
    setExtensionRequested(true);
    setExtensionPending(true);
    
    try {
      // Submit the extension request to the server
      if (presentation?.id) {
        const { submitExtensionRequest } = await import("../../lib/supabase");
        await submitExtensionRequest(
          presentation.id,
          studentName,
          presentation.current_card_index
        );
      }
      
      // For demonstration purposes, we'll simulate the teacher approving the request after 5 seconds
      // In a real implementation, this would happen through a real-time subscription
      setTimeout(() => {
        if (extensionRequested) {
          setExtensionPending(false);
          setExtensionApproved(true);
        }
      }, 5000);
    } catch (error) {
      console.error('Error requesting extension activity:', error);
      setExtensionRequested(false);
      setExtensionPending(false);
    }
  };

  // Show waiting room when lesson hasn't started yet
  if (!lessonStarted) {
    console.log(
      "StudentContent: showing waiting room, presentation:",
      presentation
    );
    return (
      <WaitingRoom
        studentName={studentName}
        avatarUrl={avatarUrl}
        sessionCode={sessionCode}
        teacherName={teacherName}
        wordleWord={presentation?.wordle_word || null}
        lessonTitle="Lesson"
      />
    );
  }

  // Show main content when lesson has started
  if (!currentCard) {
    return null;
  }

  const hasDifferentiatedContent = currentCard?.differentiatedContent
    ? true
    : false;

  return (
    <div className="min-h-screen bg-teal/5 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10 py-3 px-4">
        <StudentHeader
          studentName={studentName}
          sessionCode={sessionCode}
          avatarUrl={avatarUrl}
          newMessageCount={newMessageCount}
          onToggleMessagePanel={onToggleMessagePanel}
        />
      </header>

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-teal/20 text-teal px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <main className="flex-1 flex">
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
          <LessonContentDisplay
            title={currentCard.title}
            duration={currentCard.duration}
            content={
              viewingDifferentiated && currentCard.differentiatedContent
                ? currentCard.differentiatedContent
                : currentCard.content
            }
            extensionActivity={currentCard.extensionActivity}
            showExtensionActivity={extensionApproved}
            attachments={currentCardAttachments}
            hasDifferentiatedContent={hasDifferentiatedContent}
            viewingDifferentiated={viewingDifferentiated}
            generatingDifferentiated={generatingDifferentiated}
            onToggleDifferentiatedView={onToggleDifferentiatedView}
            onGenerateDifferentiated={onGenerateDifferentiated}
          />

          <StudentFeedbackPanel
            presentationId={presentation?.id || ""}
            studentName={studentName}
            currentCardIndex={presentation?.current_card_index || 0}
            onFeedbackSubmitted={onSendFeedback}
            onQuestionSubmitted={() => onSendQuestion("Sample question")}
            onExtensionRequested={handleExtensionRequest}
            showExtensionButton={currentCard.type === 'activity' && hasExtensionActivity && !extensionRequested}
            extensionRequested={extensionRequested}
            extensionPending={extensionPending}
            extensionApproved={extensionApproved}
          />
        </div>

        {/* Message Panel */}
        <MessagePanel
          messages={messages}
          isOpen={showMessagePanel}
          onClose={onToggleMessagePanel}
        />
      </main>

      {/* New Message Indicator */}
      {newMessageCount > 0 && !showMessagePanel && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={onToggleMessagePanel}
            className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-full shadow-lg hover:bg-teal/90 transition-colors"
          >
            <span>
              {newMessageCount} new{" "}
              {newMessageCount === 1 ? "message" : "messages"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}