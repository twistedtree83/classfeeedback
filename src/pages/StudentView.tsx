import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Bell, X } from 'lucide-react';
import { JoinSessionForm } from '../components/JoinSessionForm';
import { MessagePanel } from '../components/MessagePanel';
import { StudentHeader } from '../components/student/StudentHeader';
import { LessonContentDisplay } from '../components/student/LessonContentDisplay';
import { StudentInteractionPanel } from '../components/student/StudentInteractionPanel';

import { 
  getLessonPresentationByCode, 
  subscribeToLessonPresentation, 
  submitTeachingFeedback, 
  submitTeachingQuestion, 
  subscribeToTeacherMessages, 
  getTeacherMessagesForPresentation, 
  LessonPresentation, 
  TeacherMessage 
} from '../lib/supabase';

import { generateDifferentiatedContent } from '../lib/aiService';

export function StudentView() {
  const location = useLocation();
  const [studentName, setStudentName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState<TeacherMessage | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  
  const messageToastRef = useRef<HTMLDivElement>(null);
  
  // Extract code and name from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    const nameParam = params.get('name');
    const avatarParam = params.get('avatar');
    
    if (codeParam) {
      setSessionCode(codeParam);
      
      if (nameParam) {
        setStudentName(nameParam);
        if (avatarParam) {
          setStudentAvatar(avatarParam);
        }
        // If we have both code and name from URL, join automatically
        handleJoinSession(codeParam, nameParam, avatarParam || undefined);
      }
    }
  }, [location]);

  // Effect to handle joining a session
  const handleJoinSession = async (code: string, name: string, avatarUrl?: string) => {
    setStudentName(name);
    setStudentAvatar(avatarUrl || null);
    setSessionCode(code);
    setLoading(true);
    setError(null);
    
    try {
      // Get presentation data
      const presentationData = await getLessonPresentationByCode(code);
      
      if (!presentationData) {
        throw new Error('Session not found or has ended');
      }
      
      // Set presentation data
      setPresentation(presentationData);
      
      // Set current card
      if (presentationData.cards && presentationData.cards.length > 0) {
        setCurrentCard(presentationData.cards[presentationData.current_card_index]);
      }
      
      // Load existing messages
      const existingMessages = await getTeacherMessagesForPresentation(presentationData.id);
      if (existingMessages && existingMessages.length > 0) {
        setAllMessages(existingMessages);
      }
      
      setJoined(true);
      
      // Update URL with session code for easy rejoining
      const url = new URL(window.location.href);
      url.searchParams.set('code', code);
      url.searchParams.set('name', name);
      if (avatarUrl) {
        url.searchParams.set('avatar', avatarUrl);
      }
      window.history.pushState({}, '', url);
      
      // Set up subscriptions
      setupSubscriptions(presentationData, code);
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptions = (presentationData: LessonPresentation, code: string) => {
    // Subscribe to presentation updates
    const presentationSubscription = subscribeToLessonPresentation(
      code,
      (updatedPresentation) => {
        setPresentation(updatedPresentation);
        
        // Update current card when it changes
        if (updatedPresentation.current_card_index !== presentationData.current_card_index) {
          setCurrentCard(updatedPresentation.cards[updatedPresentation.current_card_index]);
          // Reset differentiated view when card changes
          setViewingDifferentiated(false);
        }
      }
    );
    
    // Subscribe to teacher messages
    const messageSubscription = subscribeToTeacherMessages(
      presentationData.id,
      (message) => {
        setAllMessages(prev => [...prev, message]);
        setNewMessage(message);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play prevented by browser policy"));
        
        // Increment counter if panel is closed
        if (!showMessagePanel) {
          setNewMessageCount(prev => prev + 1);
        }
      }
    );
    
    // Cleanup function
    return () => {
      presentationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  };

  useEffect(() => {
    // Reset message count when panel is opened
    if (showMessagePanel) {
      setNewMessageCount(0);
      setNewMessage(null);
    }
  }, [showMessagePanel]);

  // Effect to update current card when presentation changes
  useEffect(() => {
    if (presentation && presentation.cards) {
      setCurrentCard(presentation.cards[presentation.current_card_index]);
    }
  }, [presentation]);

  const handleSendFeedback = async (type: string) => {
    if (!presentation || isSending) return;
    
    setIsSending(true);
    
    try {
      const success = await submitTeachingFeedback(
        presentation.id,
        studentName,
        type
      );
      
      if (success) {
        setSuccessMessage('Feedback sent successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to send feedback. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuestion = async (question: string) => {
    if (!presentation || !question.trim() || isSending) return false;
    
    setIsSending(true);
    
    try {
      const success = await submitTeachingQuestion(
        presentation.id,
        studentName,
        question.trim()
      );
      
      if (success) {
        setSuccessMessage('Question sent successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        return true;
      } else {
        setError('Failed to send question. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('An error occurred. Please try again.');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateDifferentiated = async () => {
    if (!currentCard || generatingDifferentiated) return;
    
    setGeneratingDifferentiated(true);
    setError(null);
    
    try {
      // Create a differentiated version of the current card
      const differentiatedContent = await generateDifferentiatedContent(
        currentCard.content,
        currentCard.type,
        "student-friendly" // Level can be determined from the lesson level if available
      );
      
      // Update the card with differentiated content
      if (presentation && currentCard) {
        const updatedCards = [...presentation.cards];
        const cardIndex = presentation.current_card_index;
        
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          differentiatedContent
        };
        
        // Update the presentation in state
        setPresentation({
          ...presentation,
          cards: updatedCards
        });
        
        // Set current card
        setCurrentCard({
          ...currentCard,
          differentiatedContent
        });
        
        // Switch to differentiated view
        setViewingDifferentiated(true);
        
        // Show success message
        setSuccessMessage('Simpler version created!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating differentiated content:', error);
      setError('Failed to create simpler explanation. Please try again.');
    } finally {
      setGeneratingDifferentiated(false);
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <JoinSessionForm onJoinSession={handleJoinSession} />
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
      {newMessage && (
        <div 
          ref={messageToastRef}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg shadow-md flex items-start gap-3 max-w-sm border border-blue-200"
        >
          <Bell className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="flex-1">
            <div className="font-medium mb-1">Message from teacher:</div>
            <div>{newMessage.message_content}</div>
          </div>
          <button 
            onClick={() => setNewMessage(null)}
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
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
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