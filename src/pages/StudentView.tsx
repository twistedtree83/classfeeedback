import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  getSessionByCode,
  addSessionParticipant,
  submitTeachingFeedback,
  submitTeachingQuestion,
  subscribeToTeacherMessages,
  getTeacherMessagesForPresentation,
  TeacherMessage,
  checkParticipantStatus,
  subscribeToParticipantStatus
} from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MessagePanel } from '../components/MessagePanel';
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  Send,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowLeftCircle,
  ArrowRightCircle,
  BookOpen,
  MessageSquareText,
  MessageSquare,
  Bell,
  X,
  Split,
  Loader2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import type { LessonPresentation, ParticipantStatus, LessonCard } from '../lib/types';
import { generateDifferentiatedContent } from '../lib/aiService';
import { sanitizeHtml } from '../lib/utils';

interface AvatarOption {
  src: string;
  alt: string;
}

export function StudentView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('/images/avatars/co2.png');
  const [question, setQuestion] = useState<string>('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [teacherMessage, setTeacherMessage] = useState<any>(null);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [status, setStatus] = useState<ParticipantStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [teacherName, setTeacherName] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  
  const availableAvatars: AvatarOption[] = [
    { src: '/images/avatars/co2.png', alt: 'Avatar 1' },
    { src: '/images/avatars/co5.png', alt: 'Avatar 2' },
    { src: '/images/avatars/co6.png', alt: 'Avatar 3' },
    { src: '/images/avatars/co7.png', alt: 'Avatar 4' }
  ];

  // Extract code and name from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    const nameParam = params.get('name');
    const avatarParam = params.get('avatar');
    
    if (codeParam) {
      setSessionCode(codeParam);
    }
    
    if (nameParam) {
      setStudentName(nameParam);
    }
    
    if (avatarParam && availableAvatars.some(a => a.src === avatarParam)) {
      setSelectedAvatar(avatarParam);
    }
    
    // If we have both code and name from URL, auto-join
    if (codeParam && nameParam) {
      handleJoinWithParams(codeParam, nameParam, avatarParam || '/images/avatars/co2.png');
    }
  }, [location]);

  // Auto-join using URL parameters
  const handleJoinWithParams = async (code: string, name: string, avatar: string) => {
    if (joined) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const session = await getSessionByCode(code);
      if (!session) {
        throw new Error('Session not found or has ended');
      }
      
      setTeacherName(session.teacher_name);
      
      const participant = await addSessionParticipant(code, name);
      if (!participant) {
        throw new Error('Failed to join session');
      }
      
      setParticipantId(participant.id);
      setStatus('pending');
      setSelectedAvatar(avatar);
      
    } catch (err) {
      console.error('Error auto-joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setLoading(false);
    }
  };

  // Check participant approval status with direct subscription
  useEffect(() => {
    if (!participantId || !sessionCode) return;
    
    console.log(`Setting up participant status subscription for ${participantId}`);
    
    const subscription = subscribeToParticipantStatus(
      participantId,
      (newStatus) => {
        console.log(`Received status update for participant ${participantId}: ${newStatus}`);
        setStatus(newStatus);
        
        // Handle approval
        if (newStatus === 'approved') {
          console.log('Participant approved - loading lesson presentation');
          setJoined(true);
          
          // Get presentation data
          getLessonPresentationByCode(sessionCode)
            .then(presentationData => {
              if (presentationData) {
                console.log("Approved for teaching session:", presentationData);
                setPresentation(presentationData);
              } else {
                console.error('Presentation not found after approval');
                setError('Presentation not found');
              }
            })
            .catch(err => {
              console.error('Error loading presentation after approval:', err);
              setError('Error loading presentation');
            })
            .finally(() => setLoading(false));
        } else if (newStatus === 'rejected') {
          setError('Your name was not approved by the teacher. Please try again with a different name.');
          setLoading(false);
        }
      }
    );
    
    // Initial status check
    const checkStatus = async () => {
      setChecking(true);
      try {
        const currentStatus = await checkParticipantStatus(participantId);
        console.log("Current participant status:", currentStatus);
        
        setStatus(currentStatus);
        
        if (currentStatus === 'approved') {
          // Already approved, proceed with loading presentation
          setJoined(true);
          const presentationData = await getLessonPresentationByCode(sessionCode);
          if (presentationData) {
            console.log("Initially approved for teaching session:", presentationData);
            setPresentation(presentationData);
          } else {
            console.error('Presentation not found on initial check');
            setError('Presentation not found');
          }
          setLoading(false);
        } else if (currentStatus === 'rejected') {
          setError('Your name was not approved by the teacher. Please try again with a different name.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in initial status check:', err);
      } finally {
        setChecking(false);
      }
    };
    
    // Run the initial check
    checkStatus();
    
    // Set up a polling fallback just in case the subscription doesn't work
    const pollingInterval = setInterval(async () => {
      if (status !== 'pending') return;
      
      try {
        const currentStatus = await checkParticipantStatus(participantId);
        if (currentStatus === 'approved') {
          setJoined(true);
          const presentationData = await getLessonPresentationByCode(sessionCode);
          if (presentationData) {
            console.log("Approved via polling:", presentationData);
            setPresentation(presentationData);
            setLoading(false);
          }
        } else if (currentStatus === 'rejected') {
          setError('Your name was not approved by the teacher. Please try again with a different name.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking participant status:', err);
      }
    }, 5000);
    
    return () => {
      console.log("Cleaning up participant status subscription and polling");
      subscription.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [participantId, sessionCode, status]);

  // Load past teacher messages when joining a session
  useEffect(() => {
    if (!presentation?.id) return;

    const loadTeacherMessages = async () => {
      try {
        console.log("Loading teacher messages for presentation:", presentation.id);
        const messages = await getTeacherMessagesForPresentation(presentation.id);
        
        if (messages && Array.isArray(messages)) {
          setAllMessages(messages);
          
          // If there are messages, show a notification
          if (messages.length > 0) {
            setNewMessageCount(messages.length);
            // Set the most recent message as the toast notification
            setTeacherMessage(messages[messages.length - 1]);
          }
        }
      } catch (err) {
        console.error('Error loading teacher messages:', err);
      }
    };

    loadTeacherMessages();
  }, [presentation?.id]);

  // Subscribe to presentation updates
  useEffect(() => {
    if (!presentation?.session_code || !joined) return;

    console.log("Setting up presentation subscription for code:", presentation.session_code);
    const presentationSubscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        console.log("Received presentation update");
        
        // Get the full presentation data to ensure we have parsed cards
        getLessonPresentationByCode(presentation.session_code)
          .then(fullPresentation => {
            if (fullPresentation) {
              setPresentation(fullPresentation);
              
              // Update current card index
              setCurrentCardIndex(fullPresentation.current_card_index);
              
              // Reset differentiated view when card changes
              if (fullPresentation.current_card_index !== currentCardIndex) {
                setViewingDifferentiated(false);
              }
            }
          })
          .catch(err => console.error('Error refreshing presentation:', err));
      }
    );

    return () => {
      console.log("Cleaning up presentation subscription");
      presentationSubscription.unsubscribe();
    };
  }, [presentation?.session_code, joined, currentCardIndex]);

  // Separate subscription for teacher messages
  useEffect(() => {
    if (!presentation?.id || !joined) return;
    
    console.log("Setting up message subscription for presentation:", presentation.id);
    
    // Create a new audio element each time to avoid playback issues
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
          if (isDuplicate) return prevMessages;
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
  }, [presentation?.id, joined, showMessagePanel]);

  // Reset message count when panel is opened
  useEffect(() => {
    if (showMessagePanel) {
      setNewMessageCount(0);
      // Dismiss the toast notification when opening the panel
      setTeacherMessage(null);
    }
  }, [showMessagePanel]);

  // Get the current card based on the presentation's current_card_index
  const currentCard: LessonCard | null = presentation?.cards?.[currentCardIndex] || null;
  const hasDifferentiatedContent = currentCard?.differentiatedContent ? true : false;
  
  // Get the appropriate content to display based on differentiation settings
  const cardContent = viewingDifferentiated && currentCard?.differentiatedContent 
    ? currentCard.differentiatedContent 
    : currentCard?.content || '';

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

    setLoading(true);
    setError(null);
    setStatus(null);
    
    try {
      console.log("Joining session with code:", sessionCode.trim().toUpperCase());
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      
      if (!session) {
        throw new Error('Session not found or has ended');
      }

      console.log("Session found:", session);
      setTeacherName(session.teacher_name);
      
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(),
        studentName.trim()
      );
      
      if (!participant) {
        throw new Error('Failed to join session');
      }
      
      console.log("Added as participant:", participant);
      
      // Store participant id for status checking
      setParticipantId(participant.id);
      setStatus('pending');
      
      // Update URL with session code and name for easy rejoining
      const url = new URL(window.location.href);
      url.searchParams.set('code', sessionCode.trim().toUpperCase());
      url.searchParams.set('name', studentName.trim());
      url.searchParams.set('avatar', selectedAvatar);
      window.history.pushState({}, '', url);
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setLoading(false);
    }
  };

  const handleTeachingFeedback = async (type: string) => {
    if (!presentation || isSendingFeedback) return;
    
    setIsSendingFeedback(true);
    setError(null);

    try {
      await submitTeachingFeedback(
        presentation.id,
        studentName,
        type
      );
      
      setSuccessMessage('Feedback submitted successfully!');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!presentation || !question.trim() || isSendingFeedback) return;
    
    setIsSendingFeedback(true);
    setError(null);

    try {
      console.log("Submitting question:", question);
      const success = await submitTeachingQuestion(
        presentation.id,
        studentName,
        question.trim()
      );
      
      if (success) {
        setQuestion('');
        setShowQuestionForm(false);
        setSuccessMessage('Your question has been sent to the teacher!');
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to send question. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const toggleMessagePanel = () => {
    setShowMessagePanel(prev => !prev);
    if (!showMessagePanel) {
      setNewMessageCount(0);
      // Dismiss the toast notification when opening the panel
      setTeacherMessage(null);
    }
  };

  const toggleDifferentiatedView = () => {
    setViewingDifferentiated(!viewingDifferentiated);
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
        updatedCards[currentCardIndex] = {
          ...updatedCards[currentCardIndex],
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
        setSuccessMessage('Created a simpler explanation!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error generating differentiated content:', error);
      setError('Failed to create simpler explanation. Please try again.');
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  // Render join form when not joined
  if (!joined && !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-6">
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
                disabled={loading}
                className="uppercase text-lg tracking-wide"
                autoFocus
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose an Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableAvatars.map((avatar, index) => (
                    <div 
                      key={index}
                      onClick={() => setSelectedAvatar(avatar.src)}
                      className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${
                        selectedAvatar === avatar.src 
                          ? 'border-indigo-500 bg-indigo-50 scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={avatar.src} 
                        alt={avatar.alt}
                        className="w-full h-auto rounded-full" 
                      />
                    </div>
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
                disabled={loading || !sessionCode.trim() || !studentName.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? 'Joining...' : 'Join Session'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render pending approval view
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              {checking ? (
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
              ) : (
                <AlertCircle className="h-12 w-12 text-yellow-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Waiting for Approval
            </h2>
            <p className="text-gray-600 mb-6">
              Your request to join this session is being reviewed by {teacherName || 'the teacher'}.
            </p>
            <div className="animate-pulse bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg inline-block">
              Please wait while the teacher approves your name...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render rejected view
  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Name Not Approved
            </h2>
            <p className="text-gray-600 mb-6">
              {teacherName || 'The teacher'} did not approve your name. This may be because it was inappropriate or didn't match classroom guidelines.
            </p>
            <Button
              onClick={() => {
                // Reset all states to go back to the join form
                setStatus(null);
                setParticipantId(null);
                setJoined(false);
                setLoading(false);
              }}
              className="w-full"
              size="lg"
            >
              Try Again with a Different Name
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render loading view
  if (loading || !presentation || !currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading lesson content...</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-red-600 mb-6">
                  <AlertCircle className="h-16 w-16 mx-auto" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Session Not Found</h2>
                <p className="text-gray-600 mb-6">
                  This session may have ended or the code is invalid.
                </p>
                <Button 
                  onClick={() => {
                    // Reset states to go back to join form
                    setStatus(null);
                    setParticipantId(null);
                    setJoined(false);
                    setPresentation(null);
                    setError(null);
                  }}
                  size="lg"
                >
                  Try Another Code
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main student view
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10 py-3 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src={selectedAvatar} 
              alt="Student avatar" 
              className="h-8 w-8 rounded-full bg-indigo-100"
            />
            <span className="font-medium">{studentName}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMessagePanel}
              className="relative p-2 rounded-full hover:bg-gray-100 border border-gray-200"
              title="View messages"
            >
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              {newMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newMessageCount}
                </span>
              )}
            </button>
            <span className="text-sm font-mono bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md">
              {presentation.session_code}
            </span>
          </div>
        </div>
      </header>

      {/* Teacher Message Toast */}
      {teacherMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg shadow-md flex items-start gap-3 max-w-sm border border-blue-200">
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

      <main className="flex-1 flex">
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
          {currentCard && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-indigo-100">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h2 className="text-xl font-bold">{currentCard.title}</h2>
                {currentCard.duration && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {currentCard.duration}
                  </div>
                )}
              </div>
              
              <div 
                ref={contentRef}
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(cardContent) }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => handleTeachingFeedback('understand')}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px] text-green-700 border-green-200 hover:bg-green-50"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              I Understand
            </Button>

            <Button
              onClick={() => handleTeachingFeedback('confused')}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px] text-yellow-700 border-yellow-200 hover:bg-yellow-50"
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              I'm Confused
            </Button>

            <Button
              onClick={() => setShowQuestionForm(true)}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px] text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Ask Question
            </Button>

            {hasDifferentiatedContent ? (
              <Button
                onClick={toggleDifferentiatedView}
                disabled={isSendingFeedback}
                variant="outline"
                className={`flex-1 max-w-[200px] ${
                  viewingDifferentiated 
                    ? 'text-purple-700 border-purple-200 bg-purple-50' 
                    : 'text-purple-700 border-purple-200 hover:bg-purple-50'
                }`}
              >
                <Split className="h-5 w-5 mr-2" />
                {viewingDifferentiated ? 'View Original' : 'View Simplified'}
              </Button>
            ) : (
              <Button
                onClick={handleGenerateDifferentiated}
                disabled={isSendingFeedback || generatingDifferentiated}
                variant="outline"
                className="flex-1 max-w-[200px] text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                {generatingDifferentiated ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Split className="h-5 w-5 mr-2" />
                )}
                Simplify Content
              </Button>
            )}
          </div>
        </div>

        {/* Message Panel */}
        <MessagePanel
          messages={allMessages}
          isOpen={showMessagePanel}
          onClose={toggleMessagePanel}
        />
      </main>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Ask a Question</h3>
            <form onSubmit={handleSendQuestion}>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full h-32 p-3 border rounded-lg mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuestionForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!question.trim() || isSendingFeedback}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {(successMessage || error) && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg ${
          successMessage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {successMessage || error}
        </div>
      )}
    </div>
  );
}