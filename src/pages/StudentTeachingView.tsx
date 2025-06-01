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
import { ThumbsUp, ThumbsDown, HelpCircle, Send, Clock, User } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Join Lesson
            </h2>
            
            <form onSubmit={handleJoinSession} className="space-y-4">
              <Input
                label="Session Code"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                disabled={loading}
                className="uppercase"
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
                <div className="p-3 rounded-lg bg-red-100 text-red-800 text-center">
                  {error}
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <HelpCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">
              This session may have ended or the code is invalid.
            </p>
            <Button onClick={() => setJoined(false)}>
              Try Another Code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with session info */}
      <header className="bg-white shadow-sm py-2 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700">{studentName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
              {presentation.session_code}
            </span>
            <span className="text-xs text-gray-500">
              Card {presentation.current_card_index + 1} of {presentation.cards.length}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {currentCard.title}
                </h2>
                {currentCard.duration && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{currentCard.duration}</span>
                  </div>
                )}
              </div>
              
              {/* Progress indicator */}
              <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
                <div className="text-sm font-medium">
                  {Math.round(((presentation.current_card_index + 1) / presentation.cards.length) * 100)}%
                </div>
              </div>
            </div>

            <div 
              ref={contentRef}
              className="prose max-w-none whitespace-pre-wrap text-gray-700 overflow-auto max-h-[calc(100vh-24rem)]"
            >
              {currentCard.content.split('\n').map((line, i) => (
                <p key={i} className="mb-4 leading-relaxed">{line || '\u00A0'}</p>
              ))}
            </div>
          </div>

          {/* Feedback section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">How are you following along?</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Button
                onClick={() => handleFeedback('understand')}
                disabled={feedbackCooldown}
                variant={feedbackSubmitted === 'understand' ? 'primary' : 'outline'}
                className={feedbackSubmitted === 'understand' ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-200 hover:bg-green-50'}
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                I understand
              </Button>
              
              <Button
                onClick={() => handleFeedback('confused')}
                disabled={feedbackCooldown}
                variant={feedbackSubmitted === 'confused' ? 'primary' : 'outline'}
                className={feedbackSubmitted === 'confused' ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                I'm confused
              </Button>
              
              <Button
                onClick={() => handleFeedback('slower')}
                disabled={feedbackCooldown}
                variant={feedbackSubmitted === 'slower' ? 'primary' : 'outline'}
                className={feedbackSubmitted === 'slower' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}
              >
                <Clock className="h-5 w-5 mr-2" />
                Slow down
              </Button>
            </div>
            
            <form onSubmit={handleSubmitQuestion} className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Ask a question</h3>
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