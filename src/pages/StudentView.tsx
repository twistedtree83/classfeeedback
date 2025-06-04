import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Bell, X } from 'lucide-react';
import { JoinSessionForm } from '../components/JoinSessionForm';
import { MessagePanel } from '../components/MessagePanel';
import { StudentHeader } from '../components/student/StudentHeader';
import { LessonContentDisplay } from '../components/student/LessonContentDisplay';
import { StudentInteractionPanel } from '../components/student/StudentInteractionPanel';
import { useStudentSession } from '../hooks/useStudentSession';
import { useFeedbackSubmission } from '../hooks/useFeedbackSubmission';

export function StudentView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [studentName, setStudentName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const messageToastRef = useRef<HTMLDivElement>(null);
  
  // Extract code from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setSessionCode(codeParam);
    }
  }, [location]);

  // Use our custom hooks for session and feedback management
  const { 
    presentation, 
    currentCard, 
    messages: allMessages, 
    newMessage: teacherMessage,
    loading, 
    error,
    clearNewMessage,
    clearError
  } = useStudentSession(sessionCode, studentName);

  const {
    sendFeedback,
    sendQuestion,
    generateDifferentiated,
    isSending,
    generatingDifferentiated,
    successMessage,
    error: feedbackError,
    clearError: clearFeedbackError
  } = useFeedbackSubmission(presentation?.id, studentName);

  // Update new message count when a message is received
  useEffect(() => {
    if (teacherMessage && !showMessagePanel) {
      setNewMessageCount(prev => prev + 1);
    }
  }, [teacherMessage, showMessagePanel]);

  // Reset message count when panel is opened
  useEffect(() => {
    if (showMessagePanel) {
      setNewMessageCount(0);
      clearNewMessage();
    }
  }, [showMessagePanel, clearNewMessage]);

  const handleJoinSession = (code: string, name: string, avatarUrl?: string) => {
    setStudentName(name);
    setStudentAvatar(avatarUrl || null);
    setSessionCode(code);
    setJoined(true);

    // Update URL with session code for easy rejoining
    const url = new URL(window.location.href);
    url.searchParams.set('code', code);
    window.history.pushState({}, '', url);
  };

  const handleSendFeedback = async (type: string) => {
    if (!presentation) return;
    await sendFeedback(type);
  };

  const handleSendQuestion = async (questionText: string) => {
    if (!presentation) return false;
    return await sendQuestion(questionText);
  };

  const handleGenerateDifferentiated = async () => {
    if (!currentCard) return;

    const differentiatedContent = await generateDifferentiated(
      currentCard.content,
      currentCard.type
    );

    if (differentiatedContent && presentation) {
      // Update the current card with the differentiated content
      const updatedCard = {
        ...currentCard,
        differentiatedContent
      };
      
      // Update presentation state with the updated card
      const updatedCards = [...presentation.cards];
      updatedCards[presentation.current_card_index] = updatedCard;
      
      // This won't update the database, just the local state
      setViewingDifferentiated(true);
      return differentiatedContent;
    }
    
    return null;
  };

  // Helper function to check if current card has differentiated content
  const hasDifferentiatedContent = !!currentCard?.differentiatedContent;

  // Determine content to display based on differentiated view
  const cardContent = viewingDifferentiated && currentCard?.differentiatedContent
    ? currentCard.differentiatedContent
    : currentCard?.content;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <JoinSessionForm 
          onJoinSession={handleJoinSession}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-3 px-4 sticky top-0 z-10">
        <StudentHeader
          studentName={studentName}
          sessionCode={sessionCode}
          avatarUrl={studentAvatar}
          newMessageCount={newMessageCount}
          onToggleMessagePanel={() => setShowMessagePanel(!showMessagePanel)}
        />
      </header>

      {/* Teacher message toast notification */}
      {teacherMessage && (
        <div 
          ref={messageToastRef}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg shadow-md flex items-start gap-3 max-w-sm border border-blue-200"
        >
          <Bell className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="flex-1">
            <div className="font-medium mb-1">Message from teacher:</div>
            <div>{teacherMessage.message_content}</div>
          </div>
          <button 
            onClick={clearNewMessage}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 text-green-800 px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {currentCard && (
            <LessonContentDisplay
              content={cardContent || ''}
              hasDifferentiatedContent={hasDifferentiatedContent}
              viewingDifferentiated={viewingDifferentiated}
              generatingDifferentiated={generatingDifferentiated}
              onToggleDifferentiatedView={() => setViewingDifferentiated(!viewingDifferentiated)}
              onGenerateDifferentiated={handleGenerateDifferentiated}
            />
          )}

          <StudentInteractionPanel
            onSendFeedback={handleSendFeedback}
            onSendQuestion={handleSendQuestion}
            isSending={isSending}
          />
          
          {(error || feedbackError) && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error || feedbackError}
            </div>
          )}
        </div>
      </main>

      {/* Message Panel */}
      <MessagePanel
        messages={allMessages}
        isOpen={showMessagePanel}
        onClose={() => setShowMessagePanel(false)}
      />
    </div>
  );
}