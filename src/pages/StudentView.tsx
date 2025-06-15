import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApprovalFlow } from "../hooks/useApprovalFlow";
import { useStudentContent } from "../hooks/useStudentContent";
import { JoinSessionForm } from "../components/student/JoinSessionForm";
import { ApprovalStatus } from "../components/student/ApprovalStatus";
import { StudentContent } from "../components/student/StudentContent";

export function StudentView() {
  const navigate = useNavigate();
  const location = useLocation();

  // Basic state for join form
  const [sessionCode, setSessionCode] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    "/images/avatars/co2.png"
  );

  // Available avatars
  const availableAvatars = [
    "/images/avatars/co1.png",
    "/images/avatars/co2.png",
    "/images/avatars/co3.png",
    "/images/avatars/co4.png",
    "/images/avatars/co5.png",
    "/images/avatars/co6.png",
    "/images/avatars/co7.png",
    "/images/avatars/co8.png",
  ];

  // Use our custom hooks
  const {
    participantId,
    status,
    checking,
    loading,
    error,
    joined,
    teacherName,
    joinSession,
    resetState,
  } = useApprovalFlow(sessionCode, studentName);

  const content = useStudentContent(sessionCode, studentName, selectedAvatar);

  // Extract code and name from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get("code");
    const nameParam = params.get("name");
    const avatarParam = params.get("avatar");

    if (!codeParam) return;

    // Set session code and other params
    setSessionCode(codeParam);

    if (nameParam) {
      setStudentName(nameParam);
    }

    if (avatarParam && availableAvatars.includes(avatarParam)) {
      setSelectedAvatar(avatarParam);
    }

    // Auto-join if we have code and name
    if (nameParam && !joined && !status && !loading) {
      handleJoinWithParams(
        codeParam,
        nameParam,
        avatarParam || "/images/avatars/co2.png"
      );
    }
  }, [location, joined, status, loading]);

  // Auto-join using URL parameters
  const handleJoinWithParams = async (
    code: string,
    name: string,
    avatar: string
  ) => {
    setSessionCode(code);
    setStudentName(name);
    setSelectedAvatar(avatar);

    // Update URL with session code and name for easy rejoining
    const url = new URL(window.location.href);
    url.searchParams.set("code", code);
    url.searchParams.set("name", name);
    url.searchParams.set("avatar", avatar);
    window.history.pushState({}, "", url);

    joinSession();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim()) {
      return;
    }

    joinSession();
  };

  // Render join form when not joined
  if (!joined && !status) {
    return (
      <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
        <JoinSessionForm
          sessionCode={sessionCode}
          studentName={studentName}
          selectedAvatar={selectedAvatar}
          loading={loading}
          error={error}
          availableAvatars={availableAvatars}
          onCodeChange={setSessionCode}
          onNameChange={setStudentName}
          onAvatarChange={setSelectedAvatar}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Render approval status (pending/rejected)
  if (status === "pending" || status === "rejected" || error) {
    return (
      <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
        <ApprovalStatus
          status={status}
          checking={checking}
          teacherName={teacherName}
          error={error}
          onReset={resetState}
        />
      </div>
    );
  }

  // Render main student content when joined
  if (joined) {
    return (
      <StudentContent
        studentName={studentName}
        sessionCode={sessionCode}
        avatarUrl={selectedAvatar}
        teacherName={teacherName}
        currentCard={content.currentCard}
        currentCardAttachments={content.currentCardAttachments}
        messages={content.messages}
        newMessageCount={content.newMessageCount}
        showMessagePanel={content.showMessagePanel}
        viewingDifferentiated={content.viewingDifferentiated}
        generatingDifferentiated={content.generatingDifferentiated}
        successMessage={content.successMessage}
        lessonStarted={content.lessonStarted}
        currentFeedback={content.currentFeedback}
        isSending={content.isSending}
        onToggleMessagePanel={content.toggleMessagePanel}
        onToggleDifferentiatedView={content.handleToggleDifferentiatedView}
        onGenerateDifferentiated={content.handleGenerateDifferentiated}
        onSendFeedback={content.sendFeedback}
        onSendQuestion={content.sendQuestion}
        presentation={content.presentation}
      />
    );
  }

  // Fallback for unexpected states
  return (
    <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
        <p>Loading session...</p>
      </div>
    </div>
  );
}