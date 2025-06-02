import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getSessionByCode, 
  addSessionParticipant, 
  submitFeedback,
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  submitTeachingQuestion,
  submitTeachingFeedback,
  getTeacherMessagesForPresentation,
  subscribeToTeacherMessages,
  TeacherMessage
} from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MessagePanel } from '../components/MessagePanel';
import { generateRandomName } from '../lib/utils';
import { 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle, 
  Send, 
  MessageSquare, 
  Bell, 
  X, 
  Clock, 
  MessageSquareText, 
  CheckCircle2,
  User,
  Split,
  Loader2
} from 'lucide-react';
import type { LessonPresentation } from '../lib/types';
import { generateDifferentiatedContent } from '../lib/aiService';
import { sanitizeHtml } from '../lib/utils';

export function StudentView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'join' | 'feedback' | 'teaching'>('join');
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [question, setQuestion] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  
  // New state variables for teacher messages
  const [teacherMessage, setTeacherMessage] = useState<TeacherMessage | null>(null);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  const messageToastRef = useRef<HTMLDivElement>(null);

  // Extract code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setSessionCode(codeParam.toUpperCase());
    }
  }, [location]);

  // Load past teacher messages when joining a session
  useEffect(() => {
    if (!presentation?.id || step !== 'teaching') return;

    const loadTeacherMessages = async () => {
      try {
        console.log("Loading teacher messages for presentation:", presentation.id);
        const messages = await getTeacherMessagesForPresentation(presentation.id);
        console.log("Loaded teacher messages:", messages);
        
        if (messages && Array.isArray(messages)) {
          setAllMessages(messages);
          
          // If there are messages, show a notification for the most recent one
          if (messages.length > 0) {
            setNewMessageCount(messages.length);
            setTeacherMessage(messages[messages.length - 1]);
          }
        }
      } catch (err) {
        console.error('Error loading teacher messages:', err);
      }
    };

    loadTeacherMessages();
  }, [presentation?.id, step]);

  // Subscribe to teacher messages
  useEffect(() => {
    if (!presentation?.id || step !== 'teaching') return;
    
    console.log("Setting up message subscription for presentation:", presentation.id);
    
    // Create a new audio element for notification sounds
    const notificationSound = new Audio('/notification.mp3');
    notificationSound.volume = 0.5;
    
    const messageSubscription = subscribeToTeacherMessages(
      presentation.id,
      (newMessage) => {
        console.log("Received new teacher message:", newMessage);
        
        // Play sound
        try {
          notificationSound.play().catch(e => {
            console.warn("Audio play prevented:", e);
          });
        } catch (err) {
          console.error("Error playing notification sound:", err);
        }
        
        // Update messages list
        setAllMessages(prevMessages => {
          // Check for duplicates
          const isDuplicate = prevMessages.some(msg => msg.id === newMessage.id);
          if (isDuplicate) {
            console.log("Duplicate message detected, skipping");
            return prevMessages;
          }
          return [...prevMessages, newMessage]; 
        });
        
        // Show toast notification
        setTeacherMessage(newMessage);
        
        // Increment counter if panel is closed
        if (!showMessagePanel) {
          setNewMessageCount(prev => prev + 1);
        }
      }
    );

    return () => {
      console.log("Cleaning up teacher messages subscription");
      messageSubscription.unsubscribe();
    };
  }, [presentation?.id, step, showMessagePanel]);

  // Reset message count when panel is opened
  useEffect(() => {
    if (showMessagePanel) {
      setNewMessageCount(0);
      // Dismiss the toast notification when opening the panel
      setTeacherMessage(null);
    }
  }, [showMessagePanel]);

  // Subscribe to presentation updates
  useEffect(() => {
    if (!presentation?.session_code) return;
    
    const presentationSubscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        console.log("Received presentation update");
        
        // Get the full presentation data to ensure we have parsed cards
        getLessonPresentationByCode(presentation.session_code)
          .then(fullPresentation => {
            if (fullPresentation) {
              setPresentation(fullPresentation);
            }
          })
          .catch(err => console.error('Error refreshing presentation:', err));
      }
    );

    return () => {
      console.log("Cleaning up presentation subscription");
      presentationSubscription.unsubscribe();
    };
  }, [presentation?.session_code]);

  const toggleMessagePanel = () => {
    console.log("Toggling message panel - Current state:", showMessagePanel, "Messages:", allMessages.length);
    setShowMessagePanel(prev => !prev);
    if (!showMessagePanel) {
      setNewMessageCount(0);
      // Dismiss the toast notification when opening the panel
      setTeacherMessage(null);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');
    
    try {
      console.log("Joining session with code:", sessionCode.trim().toUpperCase());
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      if (!session) {
        throw new Error('Session not found or has ended');
      }

      console.log("Session found:", session);
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(),
        studentName.trim()
      );

      if (!participant) {
        throw new Error('Failed to join session');
      }

      console.log("Added as participant:", participant);
      const presentationData = await getLessonPresentationByCode(sessionCode.trim().toUpperCase());
      if (!presentationData) {
        // If there's no presentation, this is just a regular feedback session
        console.log("No presentation found, joining standard feedback session");
        setStep('feedback');
      } else {
        // If there's a presentation, this is a teaching session
        console.log("Presentation data retrieved:", presentationData);
        setPresentation(presentationData);
        setStep('teaching');
      }

      // Update URL with session code for easy rejoining
      const url = new URL(window.location.href);
      url.searchParams.set('code', sessionCode.trim().toUpperCase());
      window.history.pushState({}, '', url);
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  const handleFeedback = async (type: string) => {
    if (!sessionCode || !studentName || isSendingFeedback) return;
    
    setIsSendingFeedback(true);
    setError('');
    
    try {
      const result = await submitFeedback(sessionCode, studentName, type);
      if (result) {
        setSuccessMessage('Feedback sent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to send feedback. Please try again.');
      }
    } catch (err) {
      console.error('Error sending feedback:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !presentation?.id || !studentName || isSendingFeedback) return;
    
    setIsSendingFeedback(true);
    setError('');
    
    try {
      console.log("Submitting question:", question);
      const success = await submitTeachingQuestion(
        presentation.id,
        studentName,
        question.trim()
      );

      console.log("Question submission result:", success);
      
      if (success) {
        setQuestion('');
        setShowQuestionForm(false);
        setSuccessMessage('Question sent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to submit question. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleTeachingFeedback = async (feedbackType: string) => {
    if (!presentation?.id || !studentName || isSendingFeedback) return;
    
    setIsSendingFeedback(true);
    setError('');
    
    try {
      console.log("Submitting teaching feedback:", feedbackType);
      const success = await submitTeachingFeedback(
        presentation.id,
        studentName,
        feedbackType
      );
      
      console.log("Teaching feedback result:", success);
      
      if (success) {
        setSuccessMessage('Feedback sent!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError('Failed to send feedback. Please try again.');
      }
    } catch (err) {
      console.error('Error sending teaching feedback:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const toggleDifferentiatedView = () => {
    setViewingDifferentiated(!viewingDifferentiated);
  };
  
  const handleGenerateDifferentiated = async () => {
    if (!presentation || generatingDifferentiated) return;
    
    const currentCard = presentation?.cards?.[presentation.current_card_index];
    if (!currentCard) return;
    
    setGeneratingDifferentiated(true);
    setError('');
    
    try {
      // Generate differentiated content for the current card
      const differentiatedContent = await generateDifferentiatedContent(
        currentCard.content,
        currentCard.type,
        "student-friendly" // Use a default level
      );
      
      // Update the card with the new content
      const updatedCards = [...presentation.cards];
      updatedCards[presentation.current_card_index] = {
        ...updatedCards[presentation.current_card_index],
        differentiatedContent
      };
      
      // Update the presentation in state
      setPresentation({
        ...presentation,
        cards: updatedCards
      });
      
      // Switch to differentiated view
      setViewingDifferentiated(true);
      
      // Show success message
      setSuccessMessage('Simplified content created!');
      setTimeout(() => setSuccessMessage(''), 2000);
      
    } catch (err) {
      console.error('Error generating differentiated content:', err);
      setError('Failed to create simplified content. Please try again.');
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  // Render join form
  if (step === 'join') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <BookOpen className="h-12 w-12 text-indigo-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Join Classroom Session
            </h2>

            <form onSubmit={handleJoinSession} className="space-y-5">
              <Input
                label="Session Code"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                disabled={isJoining}
                className="uppercase text-lg tracking-wide"
                autoFocus
              />

              <Input
                label="Your Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                disabled={isJoining}
              />

              {error && (
                <div className="p-4 rounded-lg bg-red-50 text-red-800 text-center flex items-center justify-center gap-2">
                  <HelpCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isJoining || !sessionCode.trim() || !studentName.trim()}
                className="w-full"
                size="lg"
              >
                {isJoining ? 'Joining...' : 'Join Lesson'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render standard feedback view
  if (step === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Joined as</span>
                <h1 className="text-lg font-medium">{studentName}</h1>
              </div>
              <div>
                <span className="text-sm text-gray-500">Class Code</span>
                <div className="font-mono font-medium">{sessionCode}</div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">How are you feeling?</h2>
              <p className="mt-2 text-gray-600">Let your teacher know your current understanding</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleFeedback('👍')}
                disabled={isSendingFeedback}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-green-50 border-2 border-green-100 hover:bg-green-100 transition-colors"
              >
                <span className="text-4xl mb-2">👍</span>
                <span className="text-sm font-medium text-green-800">I understand</span>
              </button>
              
              <button
                onClick={() => handleFeedback('😕')}
                disabled={isSendingFeedback}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-yellow-50 border-2 border-yellow-100 hover:bg-yellow-100 transition-colors"
              >
                <span className="text-4xl mb-2">😕</span>
                <span className="text-sm font-medium text-yellow-800">I'm confused</span>
              </button>
              
              <button
                onClick={() => handleFeedback('❓')}
                disabled={isSendingFeedback}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <span className="text-4xl mb-2">❓</span>
                <span className="text-sm font-medium text-blue-800">I have a question</span>
              </button>
            </div>
            
            {successMessage && (
              <div className="p-3 rounded-lg bg-green-100 text-green-800 text-center">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-800 text-center">
                {error}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Render teaching view
  const currentCard = presentation?.cards?.[presentation.current_card_index];
  const hasDifferentiatedContent = currentCard?.differentiatedContent ? true : false;
  const cardContent = viewingDifferentiated && currentCard?.differentiatedContent 
    ? currentCard.differentiatedContent 
    : currentCard?.content;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-3 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMessagePanel}
                className="relative p-2 rounded-full hover:bg-gray-100"
                title="View messages"
              >
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                {newMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {newMessageCount}
                  </span>
                )}
              </button>
              <div>
                <span className="text-sm text-gray-500">Class Code</span>
                <div className="font-mono font-medium">{sessionCode}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Teacher Message Toast */}
      {teacherMessage && (
        <div 
          ref={messageToastRef}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg shadow-md flex items-start gap-3 max-w-md border border-blue-200"
        >
          <MessageSquareText className="h-6 w-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{teacherMessage.teacher_name}:</p>
            <p className="text-sm">{teacherMessage.message_content}</p>
            <button 
              onClick={toggleMessagePanel}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              View all messages
            </button>
          </div>
          <button 
            onClick={() => setTeacherMessage(null)}
            className="p-1 text-blue-500 hover:bg-blue-100 rounded-full"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <main className="flex-1 flex flex-col p-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {/* Success message toast */}
          {successMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 text-green-800 px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* Card content */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 flex-1">
            {currentCard ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentCard.title}
                  </h2>
                  {hasDifferentiatedContent && (
                    <Button
                      onClick={toggleDifferentiatedView}
                      variant={viewingDifferentiated ? "primary" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Split className="h-4 w-4" />
                      {viewingDifferentiated ? "Standard View" : "Simplified View"}
                    </Button>
                  )}
                </div>

                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cardContent || '') }}></div>
                </div>
                
                {/* Differentiate button when there's no differentiated content yet */}
                {!hasDifferentiatedContent && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <p className="text-purple-800 mb-2">Need a simpler explanation?</p>
                    <Button
                      variant="outline"
                      className="bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200"
                      onClick={handleGenerateDifferentiated}
                      disabled={generatingDifferentiated}
                    >
                      {generatingDifferentiated ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Simplifying...
                        </>
                      ) : (
                        <>
                          <Split className="h-4 w-4 mr-2" />
                          Simplify Content
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Waiting for teacher to start the lesson...</p>
              </div>
            )}
          </div>
          
          {/* Feedback controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-800 text-center">
                {error}
              </div>
            )}
            
            {showQuestionForm ? (
              <form onSubmit={handleSendQuestion} className="space-y-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  disabled={isSendingFeedback}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQuestionForm(false)}
                    disabled={isSendingFeedback}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!question.trim() || isSendingFeedback}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Question
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => handleTeachingFeedback('understand')}
                  disabled={isSendingFeedback}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="h-5 w-5" />
                  I understand
                </Button>
                
                <Button
                  onClick={() => handleTeachingFeedback('confused')}
                  disabled={isSendingFeedback}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                >
                  <ThumbsDown className="h-5 w-5" />
                  I'm confused
                </Button>
                
                <Button
                  onClick={() => setShowQuestionForm(true)}
                  disabled={isSendingFeedback}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-5 w-5" />
                  Ask a question
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Message indicator button that's always visible when there are new messages */}
      {newMessageCount > 0 && !showMessagePanel && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleMessagePanel}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span>{newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}</span>
          </button>
        </div>
      )}

      {/* Message Panel */}
      <MessagePanel
        messages={allMessages}
        isOpen={showMessagePanel}
        onClose={() => setShowMessagePanel(false)}
      />
    </div>
  );
}