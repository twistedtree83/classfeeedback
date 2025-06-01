import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getLessonPresentationByCode, 
  subscribeToLessonPresentation,
  getSessionByCode,
  addSessionParticipant,
  submitTeachingFeedback,
  submitTeachingQuestion
} from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
  BookOpen
} from 'lucide-react';
import type { LessonPresentation } from '../lib/types';

export function StudentTeachingView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [joined, setJoined] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);
  const [feedbackCooldown, setFeedbackCooldown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract code from URL query params if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setSessionCode(codeParam);
    }
  }, [location]);

  const currentCard = presentation?.cards?.[presentation.current_card_index];
  const isFirstCard = presentation?.current_card_index === 0;
  const isLastCard = presentation?.current_card_index === presentation?.cards.length - 1;

  // Scroll to top when card changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [presentation?.current_card_index]);

  useEffect(() => {
    if (!presentation?.session_code || !joined) return;
    
    const subscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        getLessonPresentationByCode(presentation.session_code)
          .then(fullPresentation => {
            if (fullPresentation) {
              setPresentation(fullPresentation);
              
              // Reset feedback status on card change
              if (fullPresentation.current_card_index !== presentation.current_card_index) {
                setFeedbackSubmitted(null);
              }
            }
          })
          .catch(err => console.error('Error refreshing presentation:', err));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [presentation?.session_code, presentation?.current_card_index, joined]);

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

    try {
      // First check if the session exists and is active
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      if (!session) {
        throw new Error('Session not found or has ended');
      }

      // Add participant to session
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(), 
        studentName.trim()
      );
      
      if (!participant) {
        throw new Error('Failed to join session');
      }
      
      const presentationData = await getLessonPresentationByCode(sessionCode.trim().toUpperCase());
      if (!presentationData) {
        throw new Error('Presentation not found');
      }
      
      setPresentation(presentationData);
      setJoined(true);
      
      // Update URL with code parameter without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('code', sessionCode.trim().toUpperCase());
      window.history.pushState({}, '', url);
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type: string) => {
    if (!presentation || feedbackCooldown) return;
    
    setFeedbackCooldown(true);
    
    try {
      await submitTeachingFeedback(
        presentation.id,
        studentName,
        type
      );
      
      setFeedbackSubmitted(type);
      setShowSuccessMessage(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      
      // Set cooldown to prevent spam
      setTimeout(() => {
        setFeedbackCooldown(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!presentation || !question.trim()) return;
    
    try {
      await submitTeachingQuestion(
        presentation.id,
        studentName,
        question.trim()
      );
      
      setQuestion('');
      setShowSuccessMessage(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (err) {
      console.error('Error submitting question:', err);
    }
  };

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
                disabled={loading}
                className="uppercase text-lg tracking-wide"
                autoFocus
              />
              
              <Input
                label="Your Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                disabled={loading}
              />
              
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
                {loading ? 'Joining...' : 'Join Lesson'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!presentation || !currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-600 mb-6">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Session Not Found</h2>
            <p className="text-gray-600 mb-6">
              This session may have ended or the code is invalid.
            </p>
            <Button onClick={() => setJoined(false)} size="lg">
              Try Another Code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = ((presentation.current_card_index + 1) / presentation.cards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with session info and progress bar */}
      <header className="bg-white shadow-sm py-3 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Card {presentation.current_card_index + 1} of {presentation.cards.length}
              </span>
              <span className="text-sm font-mono bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md">
                {presentation.session_code}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Success message toast */}
          {showSuccessMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 text-green-800 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 animate-fade-in-out">
              <CheckCircle2 className="h-5 w-5" />
              <span>Successfully sent to teacher!</span>
            </div>
          )}
          
          {/* Card navigation for smaller screens */}
          <div className="flex justify-between items-center lg:hidden">
            <Button
              onClick={() => setPresentation({
                ...presentation,
                current_card_index: presentation.current_card_index - 1
              })}
              disabled={isFirstCard}
              variant="outline"
              className="w-12 h-12 p-0 rounded-full flex items-center justify-center"
            >
              <ArrowLeftCircle className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium rounded-full h-10 w-10">
                {Math.round(progressPercentage)}%
              </div>
            </div>
            
            <Button
              onClick={() => setPresentation({
                ...presentation,
                current_card_index: presentation.current_card_index + 1
              })}
              disabled={isLastCard}
              variant="outline"
              className="w-12 h-12 p-0 rounded-full flex items-center justify-center"
            >
              <ArrowRightCircle className="h-5 w-5" />
            </Button>
          </div>

          {/* Content card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Card header */}
            <div className="bg-indigo-50 p-4 border-b border-indigo-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentCard.title}
                  </h2>
                  {currentCard.duration && (
                    <div className="flex items-center text-indigo-700 text-sm mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{currentCard.duration}</span>
                    </div>
                  )}
                </div>
                
                {/* Progress circle for larger screens */}
                <div className="hidden lg:flex bg-white rounded-full w-14 h-14 items-center justify-center shadow">
                  <div className="text-indigo-800 font-medium">
                    {Math.round(progressPercentage)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card content */}
            <div 
              ref={contentRef}
              className="p-6 overflow-auto max-h-[calc(100vh-22rem)]"
            >
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {typeof currentCard.content === 'string' && currentCard.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-4 leading-relaxed">{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
            
            {/* Card navigation for larger screens */}
            <div className="hidden lg:flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
              <Button
                onClick={() => setPresentation({
                  ...presentation,
                  current_card_index: presentation.current_card_index - 1
                })}
                disabled={isFirstCard}
                variant="outline"
                className="flex items-center gap-1"
              >
                <ArrowLeftCircle className="h-5 w-5" />
                Previous
              </Button>
              
              <span className="text-gray-500">
                {presentation.current_card_index + 1} / {presentation.cards.length}
              </span>
              
              <Button
                onClick={() => setPresentation({
                  ...presentation,
                  current_card_index: presentation.current_card_index + 1
                })}
                disabled={isLastCard}
                className="flex items-center gap-1"
              >
                Next
                <ArrowRightCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Feedback section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              How are you following along?
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <Button
                onClick={() => handleFeedback('understand')}
                disabled={feedbackCooldown}
                variant={feedbackSubmitted === 'understand' ? 'primary' : 'outline'}
                className={`py-3 ${feedbackSubmitted === 'understand' ? 'bg-green-600 hover:bg-green-700' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                I understand
              </Button>
              
              <Button
                onClick={() => handleFeedback('confused')}
                disabled={feedbackCooldown}
                variant={feedbackSubmitted === 'confused' ? 'primary' : 'outline'}
                className={`py-3 ${feedbackSubmitted === 'confused' ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-700 border-yellow-200 hover:bg-yellow-50'}`}
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                I'm confused
              </Button>
              
              <Button
                onClick={() => handleFeedback('slower')}
                disabled={feedbackCooldown}
                variant={feedbackSubmitted === 'slower' ? 'primary' : 'outline'}
                className={`py-3 ${feedbackSubmitted === 'slower' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-700 border-blue-200 hover:bg-blue-50'}`}
              >
                <Clock className="h-5 w-5 mr-2" />
                Slow down
              </Button>
            </div>
            
            {/* Question form */}
            <form onSubmit={handleSubmitQuestion} className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Ask a question
              </h3>
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-grow"
                />
                <Button
                  type="submit"
                  disabled={!question.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}