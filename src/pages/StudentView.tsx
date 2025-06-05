import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getLessonPresentationByCode,
  getSessionByCode,
  addSessionParticipant,
  checkParticipantStatus,
  subscribeToParticipantStatus
} from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MessagePanel } from '../components/MessagePanel';
import { StudentHeader } from '../components/student/StudentHeader';
import { LessonContentDisplay } from '../components/student/LessonContentDisplay';
import { StudentInteractionPanel } from '../components/student/StudentInteractionPanel';
import { WaitingRoom } from '../components/student/WaitingRoom';
import {
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  XCircle
} from 'lucide-react';
import type { ParticipantStatus } from '../lib/types';
import { useFeedbackSubmission } from '../hooks/useFeedbackSubmission';
import { useStudentSession } from '../hooks/useStudentSession';

interface AvatarOption {
  src: string;
  alt: string;
}

export function StudentView() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for session joining and status
  const [sessionCode, setSessionCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('/images/avatars/co2.png');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [status, setStatus] = useState<ParticipantStatus | null>(null);
  const [checking, setChecking] = useState(false);
  
  // UI control state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [joined, setJoined] = useState(false);
  
  // Reference to track if auto-join has already been triggered
  const autoJoinTriggered = useRef(false);
  // Reference to track if status effect has already set joined to true
  const joinedFromApproval = useRef(false);
  
  // Available avatars
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
    
    // If we have both code and name from URL, auto-join (only once)
    if (codeParam && nameParam && !autoJoinTriggered.current) {
      autoJoinTriggered.current = true;
      handleJoinWithParams(codeParam, nameParam, avatarParam || '/images/avatars/co2.png');
    }
  }, [location]);

  // Use custom hooks for session and feedback
  const { 
    presentation, 
    currentCard, 
    currentCardAttachments,
    messages, 
    newMessage, 
    teacherName,
    lessonStarted,
    sessionHookError // Added this to capture errors from the hook
  } = useStudentSession(sessionCode, studentName);
  
  const { 
    sendFeedback, 
    sendQuestion, 
    generateDifferentiated, 
    isSending, 
    generatingDifferentiated, 
    successMessage,
    currentFeedback,
    setCurrentCardIndex
  } = useFeedbackSubmission(presentation?.id, studentName);

  // Update current card index when it changes in the presentation
  useEffect(() => {
    if (presentation) {
      setCurrentCardIndex(presentation.current_card_index);
    }
  }, [presentation?.current_card_index, setCurrentCardIndex]);
  
  // Check participant approval status with direct subscription
  useEffect(() => {
    if (!participantId || !sessionCode) return;
    
    console.log(`Setting up participant status subscription for ${participantId}`);
    
    const subscription = subscribeToParticipantStatus(
      participantId,
      (newStatus) => {
        console.log(`Received status update for participant ${participantId}: ${newStatus}`);
        setStatus(newStatus);
        
        // Handle approval - only set joined to true once
        if (newStatus === 'approved' && !joinedFromApproval.current) {
          console.log('Participant approved - loading lesson presentation');
          joinedFromApproval.current = true;
          setJoined(true);
          setLoading(false);
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
        
        if (currentStatus === 'approved' && !joinedFromApproval.current) {
          // Already approved, proceed with joining
          joinedFromApproval.current = true;
          setJoined(true);
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
        if (currentStatus === 'approved' && !joinedFromApproval.current) {
          joinedFromApproval.current = true;
          setJoined(true);
          setLoading(false);
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

  // Reset message count when panel is opened
  useEffect(() => {
    if (showMessagePanel) {
      setNewMessageCount(0);
    }
  }, [showMessagePanel]);

  // Effect to update new message count and handle message display
  useEffect(() => {
    if (newMessage && !showMessagePanel) {
      setNewMessageCount(prev => prev + 1);
    }
  }, [newMessage, showMessagePanel]);

  // Auto-join using URL parameters
  const handleJoinWithParams = async (code: string, name: string, avatar: string) => {
    // Guard against duplicate joins
    if (joined || loading || status) {
      console.log("Auto-join skipped - already joining or joined");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const session = await getSessionByCode(code);
      if (!session) {
        throw new Error('Session not found or has ended');
      }
      
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
      
      // Mark that we've triggered an auto-join to prevent duplicates on reload
      autoJoinTriggered.current = true;
      
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

  const handleToggleDifferentiatedView = () => {
    setViewingDifferentiated(!viewingDifferentiated);
  };
  
  const handleGenerateDifferentiated = async () => {
    if (!currentCard || generatingDifferentiated) return;
    
    try {
      // Create a differentiated version of the current card
      const differentiatedContent = await generateDifferentiated(
        currentCard.content,
        currentCard.type
      );
      
      // Update the card with differentiated content
      if (presentation && currentCard && differentiatedContent) {
        const updatedCards = [...presentation.cards];
        const cardIndex = presentation.current_card_index;
        
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          differentiatedContent
        };
        
        // Switch to differentiated view
        setViewingDifferentiated(true);
      }
    } catch (error) {
      console.error('Error generating differentiated content:', error);
      setError('Failed to create simpler explanation. Please try again.');
    }
  };

  const toggleMessagePanel = () => {
    setShowMessagePanel(prev => !prev);
    if (!showMessagePanel) {
      setNewMessageCount(0);
    }
  };

  // Render join form when not joined
  if (!joined && !status) {
    return (
      <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal/20">
            <div className="flex justify-center mb-6">
              <BookOpen className="h-12 w-12 text-teal" />
            </div>

            <h2 className="text-2xl font-bold text-teal mb-6 text-center">
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
                className="uppercase text-lg tracking-wide border-teal/30 focus:border-teal focus:ring-teal"
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
                  className="border-teal/30 focus:border-teal focus:ring-teal"
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
                          ? 'border-teal bg-teal/10 scale-105' 
                          : 'border-gray-200 hover:border-teal/30 hover:bg-teal/5'
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
                <div className="p-4 rounded-lg bg-red/10 text-red border border-red/20 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !sessionCode.trim() || !studentName.trim()}
                className="w-full bg-teal hover:bg-teal/90 text-white"
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
      <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
            <div className="flex justify-center mb-6">
              {checking ? (
                <Loader2 className="h-12 w-12 text-teal animate-spin" />
              ) : (
                <AlertCircle className="h-12 w-12 text-orange" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-teal mb-4">
              Waiting for Approval
            </h2>
            <p className="text-gray-600 mb-6">
              Your request to join this session is being reviewed by {teacherName || 'the teacher'}.
            </p>
            <div className="animate-pulse bg-orange/10 text-orange border border-orange/30 px-4 py-3 rounded-lg inline-block">
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
      <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
            <div className="flex justify-center mb-6">
              <XCircle className="h-12 w-12 text-red" />
            </div>
            <h2 className="text-2xl font-bold text-red mb-4">
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
                joinedFromApproval.current = false;
              }}
              className="w-full bg-teal hover:bg-teal/90 text-white"
              size="lg"
            >
              Try Again with a Different Name
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show waiting room when student is approved but lesson hasn't started yet
  if (joined && presentation && !lessonStarted) {
    return (
      <WaitingRoom
        studentName={studentName}
        avatarUrl={selectedAvatar}
        sessionCode={sessionCode}
        teacherName={teacherName}
      />
    );
  }

  // Render loading view or session not found error
  if (loading || !presentation || !currentCard) {
    return (
      <div className="min-h-screen bg-teal/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mb-4"></div>
                <p className="text-gray-600">Loading lesson content...</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-red mb-6">
                  <AlertCircle className="h-16 w-16 mx-auto" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Session Not Found</h2>
                <p className="text-gray-600 mb-6">
                  {sessionHookError || error || "This session may have ended or the code is invalid."}
                </p>
                <Button 
                  onClick={() => {
                    // Reset states to go back to join form
                    setStatus(null);
                    setParticipantId(null);
                    setJoined(false);
                    setLoading(false);
                    setError(null);
                    joinedFromApproval.current = false;
                  }}
                  className="bg-teal hover:bg-teal/90 text-white"
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

  // Get the current card based on the presentation's current_card_index
  const card = currentCard;
  const hasDifferentiatedContent = card?.differentiatedContent ? true : false;
  
  // Get the appropriate content to display based on differentiation settings
  const cardContent = viewingDifferentiated && card?.differentiatedContent 
    ? card.differentiatedContent 
    : card?.content || '';

  // Main student view
  return (
    <div className="min-h-screen bg-teal/5 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10 py-3 px-4">
        <StudentHeader 
          studentName={studentName}
          sessionCode={sessionCode}
          avatarUrl={selectedAvatar}
          newMessageCount={newMessageCount}
          onToggleMessagePanel={toggleMessagePanel}
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
          {currentCard && (
            <LessonContentDisplay 
              content={cardContent}
              attachments={currentCardAttachments}
              hasDifferentiatedContent={hasDifferentiatedContent}
              viewingDifferentiated={viewingDifferentiated}
              generatingDifferentiated={generatingDifferentiated}
              onToggleDifferentiatedView={handleToggleDifferentiatedView}
              onGenerateDifferentiated={handleGenerateDifferentiated}
            />
          )}
          
          <StudentInteractionPanel 
            onSendFeedback={sendFeedback}
            onSendQuestion={sendQuestion}
            isSending={isSending}
            currentFeedback={currentFeedback}
          />
        </div>

        {/* Message Panel */}
        <MessagePanel
          messages={messages}
          isOpen={showMessagePanel}
          onClose={toggleMessagePanel}
        />
      </main>

      {/* New Message Indicator */}
      {newMessageCount > 0 && !showMessagePanel && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleMessagePanel}
            className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-full shadow-lg hover:bg-teal/90 transition-colors"
          >
            <span>{newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}</span>
          </button>
        </div>
      )}
    </div>
  );
}