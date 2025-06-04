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
  TeacherMessage,
  checkParticipantStatus,
  subscribeToParticipantStatus,
  getParticipantsForSession,
  SessionParticipant
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
  Loader2,
  AlertCircle,
  PlayCircle,
  Users
} from 'lucide-react';
import type { LessonPresentation } from '../lib/types';
import { generateDifferentiatedContent } from '../lib/aiService';
import { sanitizeHtml } from '../lib/utils';

export function StudentView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'join' | 'waiting' | 'welcome' | 'feedback' | 'teaching'>('join');
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [question, setQuestion] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantStatus, setParticipantStatus] = useState<string>('pending');
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [teacherMessage, setTeacherMessage] = useState<TeacherMessage | null>(null);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const messageToastRef = useRef<HTMLDivElement>(null);

  const avatars = [
    '/images/avatars/co1.png',
    '/images/avatars/co2.png',
    '/images/avatars/co3.png',
    '/images/avatars/co4.png',
    '/images/avatars/co5.png',
    '/images/avatars/co6.png',
    '/images/avatars/co7.png',
    '/images/avatars/co8.png'
  ];

  // Extract code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setSessionCode(codeParam.toUpperCase());
    }
  }, [location]);

  // Check participant status periodically
  useEffect(() => {
    if (!participantId || step !== 'waiting') return;

    console.log('Setting up participant status subscription for', participantId);
    
    // Initial status check
    checkParticipantStatus(participantId).then(status => {
      if (status) {
        console.log('Current participant status:', status);
        setParticipantStatus(status);
        
        if (status === 'approved') {
          handleParticipantApproved();
        }
      }
    });
    
    // Subscribe to status changes
    const subscription = subscribeToParticipantStatus(
      participantId,
      (status) => {
        console.log('Participant status changed to:', status);
        setParticipantStatus(status);
        
        if (status === 'approved') {
          handleParticipantApproved();
        }
      }
    );
    
    // Also set up a polling interval as a fallback
    const intervalId = setInterval(async () => {
      const status = await checkParticipantStatus(participantId);
      if (status) {
        console.log('Current participant status (from polling):', status);
        setParticipantStatus(status);
        
        if (status === 'approved') {
          handleParticipantApproved();
          clearInterval(intervalId);
        }
      }
    }, 5000);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [participantId, step]);

  // Load participants when entering welcome step
  useEffect(() => {
    if (step !== 'welcome' || !sessionCode) return;

    const loadParticipantsAndSession = async () => {
      setLoadingParticipants(true);
      try {
        // Load all participants
        const participantsData = await getParticipantsForSession(sessionCode);
        setParticipants(participantsData.filter(p => p.status === 'approved'));
        
        // Get session data for teacher name
        const sessionData = await getSessionByCode(sessionCode);
        if (sessionData) {
          setTeacherName(sessionData.teacher_name);
        }
      } catch (err) {
        console.error('Error loading participants:', err);
      } finally {
        setLoadingParticipants(false);
      }
    };
    
    loadParticipantsAndSession();
    
    // Set up polling to refresh participants list
    const intervalId = setInterval(async () => {
      try {
        const participantsData = await getParticipantsForSession(sessionCode);
        setParticipants(participantsData.filter(p => p.status === 'approved'));
      } catch (err) {
        console.error('Error refreshing participants:', err);
      }
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [step, sessionCode]);

  // Function to handle when a participant is approved
  const handleParticipantApproved = async () => {
    if (!sessionCode) return;
    
    // First move to welcome screen
    setStep('welcome');
    
    // Pre-load data for the next step
    try {
      // Check if there's a presentation for this session
      const presentationData = await getLessonPresentationByCode(sessionCode);
      if (presentationData) {
        console.log("Presentation data retrieved:", presentationData);
        setPresentation(presentationData);
      }
    } catch (err) {
      console.error('Error checking for presentation:', err);
    }
  };

  // Handle proceeding to the lesson
  const handleProceedToLesson = () => {
    if (presentation) {
      // If there's a presentation, go to teaching mode
      setStep('teaching');
    } else {
      // Otherwise, go to feedback mode
      setStep('feedback');
    }
  };

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
    if (!presentation?.session_code || step !== 'teaching') return;
    
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
  }, [presentation?.session_code, step]);

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
      
      // Save participant ID for status checking
      setParticipantId(participant.id);
      
      // Move to waiting state
      setStep('waiting');
      
      // Update URL with session code for easy rejoining
      const url = new URL(window.location.href);
      url.searchParams.set('code', sessionCode.trim().toUpperCase());
      window.history.pushState({}, '', url);
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setIsJoining(false);
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Choose Your Avatar
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {avatars.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAvatar === avatar 
                          ? 'border-indigo-500 ring-2 ring-indigo-500 transform scale-105' 
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <img 
                        src={avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 text-red-800 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isJoining || !sessionCode.trim() || !studentName.trim() || !selectedAvatar}
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

  // Render waiting for approval screen
  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-pulse mb-6">
              <div className="h-12 w-12 rounded-full bg-indigo-200 mx-auto flex items-center justify-center">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Waiting for Approval
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your request to join has been sent to the teacher. Please wait while they approve your participation.
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-indigo-600">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse delay-75"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse delay-150"></div>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="ml-2 font-medium">{studentName}</span>
              </div>
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="ml-2 font-mono">{sessionCode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render welcome screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
                Welcome to the Class!
              </h2>
              <p className="text-gray-600">
                You've been approved by the teacher and joined successfully.
              </p>
            </div>
            
            <div className="mb-8">
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="font-semibold">Your Teacher</h3>
                </div>
                <p className="ml-7 text-gray-700">{teacherName || 'Teacher'}</p>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="font-semibold">Classmates</h3>
                </div>
                
                {loadingParticipants ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                  </div>
                ) : participants.length === 0 ? (
                  <p className="text-gray-500 text-center py-2">No other students have joined yet.</p>
                ) : (
                  <ul className="ml-7 space-y-1">
                    {participants
                      .filter(p => p.student_name !== studentName) // Filter out current student
                      .map((participant, index) => (
                        <li key={participant.id} className="text-gray-700">
                          {participant.student_name}
                        </li>
                      ))}
                    <li className="text-indigo-600 font-medium">
                      {studentName} (You)
                    </li>
                  </ul>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleProceedToLesson}
              className="w-full"
              size="lg"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Lesson
            </Button>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <div className="flex items-center gap-2">
                {selectedAvatar && (
                  <img 
                    src={selectedAvatar} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full border-2 border-indigo-200"
                  />
                )}
                <span className="font-medium">{studentName}</span>
              </div>
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