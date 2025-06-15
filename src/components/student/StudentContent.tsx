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
import { submitExtensionRequest, getStudentExtensionRequestStatus } from "@/lib/supabase";

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
      
      // If we have a presentation, check for existing extension request status
      if (presentation?.id && presentation.current_card_index !== undefined) {
        getStudentExtensionRequestStatus(
          presentation.id, 
          studentName, 
          presentation.current_card_index
        ).then(status => {
          if (status === 'pending') {
            setExtensionRequested(true);
            setExtensionPending(true);
            setExtensionApproved(false);
          } else if (status === 'approved') {
            setExtensionRequested(true);
            setExtensionPending(false);
            setExtensionApproved(true);
          } else {
            // Reset states if no existing request or it was rejected
            setExtensionRequested(false);
            setExtensionPending(false);
            setExtensionApproved(false);
          }
        }).catch(err => {
          console.error('Error checking extension request status:', err);
        });
      } else {
        // Reset extension states when changing cards
        setExtensionRequested(false);
        setExtensionPending(false);
        setExtensionApproved(false);
      }
    } else {
      setHasExtensionActivity(false);
    }
  }, [currentCard, presentation?.id, presentation?.current_card_index, studentName]);

  // Handle extension activity request
  const handleExtensionRequest = async () => {
    if (!presentation?.id || presentation.current_card_index === undefined) {
      console.error('Cannot request extension - presentation data missing');
      return;
    }
    
    setExtensionRequested(true);
    setExtensionPending(true);
    
    try {
      console.log(`Student ${studentName} requesting extension activity for card index ${presentation.current_card_index}`);
      
      // Submit the extension request
      const result = await submitExtensionRequest(
        presentation.id,
        studentName,
        presentation.current_card_index
      );
      
      if (!result) {
        throw new Error('Failed to submit extension request');
      }
      
      console.log('Extension request submitted successfully:', result);
      
      // In a production implementation, we would set up a real-time subscription
      // For now, we'll poll for status changes every 5 seconds
      const checkInterval = setInterval(async () => {
        try {
          const status = await getStudentExtensionRequestStatus(
            presentation.id,
            studentName,
            presentation.current_card_index
          );
          
          console.log('Extension request status:', status);
          
          if (status === 'approved') {
            clearInterval(checkInterval);
            setExtensionPending(false);
            setExtensionApproved(true);
          } else if (status === 'rejected') {
            clearInterval(checkInterval);
            setExtensionRequested(false);
            setExtensionPending(false);
            setExtensionApproved(false);
          }
        } catch (error) {
          console.error('Error checking extension request status:', error);
        }
      }, 5000);
      
      // Clean up interval on component unmount
      return () => clearInterval(checkInterval);
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
            hasDifferentiatedContent={!!currentCard.differentiatedContent}
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