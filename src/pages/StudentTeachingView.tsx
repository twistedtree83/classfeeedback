import React, { useState } from "react";
import { useStudentTeachingSession } from "../hooks/useStudentTeachingSession";
import { StudentSessionJoin } from "../components/student/StudentSessionJoin";
import { StudentNavigation } from "../components/student/StudentNavigation";
import { StudentCardDisplay } from "../components/student/StudentCardDisplay";
import { StudentFeedbackPanel } from "../components/student/StudentFeedbackPanel";
import { TeacherMessageToast } from "../components/student/TeacherMessageToast";
import { MessagePanel } from "../components/MessagePanel";

export function StudentTeachingView() {
  const {
    // State from hook
    presentation,
    loading,
    error,
    sessionCode,
    studentName,
    joined,
    status,
    checking,
    teacherMessage,
    allMessages,
    newMessageCount,
    currentCard,
    isFirstCard,
    isLastCard,

    // Actions from hook
    setSessionCode,
    setStudentName,
    setTeacherMessage,
    setNewMessageCount,
    handleJoinSession,
  } = useStudentTeachingSession();

  // Local state for UI interactions
  const [showMessagePanel, setShowMessagePanel] = useState(false);

  // If not joined yet, show the join interface
  if (!joined) {
    return (
      <StudentSessionJoin
        sessionCode={sessionCode}
        studentName={studentName}
        loading={loading}
        error={error}
        status={status}
        checking={checking}
        onSessionCodeChange={setSessionCode}
        onStudentNameChange={setStudentName}
        onSubmit={handleJoinSession}
      />
    );
  }

  // If joined but no presentation data yet, show loading
  if (!presentation || !currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson content...</p>
        </div>
      </div>
    );
  }

  const toggleMessagePanel = () => {
    setShowMessagePanel(!showMessagePanel);
    if (!showMessagePanel) {
      setNewMessageCount(0); // Clear notification count when opening
    }
  };

  const handleFeedbackSubmitted = (type: string) => {
    console.log(`Feedback submitted: ${type}`);
  };

  const handleQuestionSubmitted = () => {
    console.log("Question submitted");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <StudentNavigation
        currentCardIndex={presentation.current_card_index}
        totalCards={presentation.cards.length}
        isFirstCard={isFirstCard}
        isLastCard={isLastCard}
        sessionCode={sessionCode}
        newMessageCount={newMessageCount}
        onToggleMessagePanel={toggleMessagePanel}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ${
            showMessagePanel ? "mr-80" : ""
          }`}
        >
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card Display - Takes up 2 columns */}
                <div className="lg:col-span-2">
                  <StudentCardDisplay
                    card={currentCard}
                    level={presentation.level}
                  />
                </div>

                {/* Feedback Panel - Takes up 1 column */}
                <div className="lg:col-span-1">
                  <StudentFeedbackPanel
                    presentationId={presentation.id}
                    studentName={studentName}
                    currentCardIndex={presentation.current_card_index}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                    onQuestionSubmitted={handleQuestionSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Panel Sidebar */}
        {showMessagePanel && (
          <div className="fixed right-0 top-20 h-[calc(100vh-80px)] w-80 bg-white border-l border-gray-200 shadow-lg z-40">
            <MessagePanel
              messages={allMessages}
              onClose={() => setShowMessagePanel(false)}
            />
          </div>
        )}
      </div>

      {/* Teacher Message Toast */}
      <TeacherMessageToast
        message={teacherMessage}
        onDismiss={() => setTeacherMessage(null)}
      />
    </div>
  );
}
