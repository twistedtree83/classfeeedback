import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getSessionByCode, 
  addSessionParticipant, 
  submitFeedback,
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  submitTeachingQuestion,
  submitTeachingFeedback
} from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { generateRandomName } from '../lib/utils';
import { BookOpen, ThumbsUp, ThumbsDown, HelpCircle, Send, MessageSquare } from 'lucide-react';
import type { LessonPresentation } from '../lib/types';

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

  // Extract code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setSessionCode(codeFromUrl.toUpperCase());
    }
  }, [location]);

  // Subscribe to presentation updates
  useEffect(() => {
    if (!presentation?.session_code) return;
    
    const subscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        setPresentation(updatedPresentation);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [presentation?.session_code]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    setIsJoining(true);
    setError('');
    
    try {
      const formattedCode = sessionCode.trim().toUpperCase();
      const session = await getSessionByCode(formattedCode);
      
      if (!session) {
        setError('Invalid class code or expired session');
        setIsJoining(false);
        return;
      }
      
      // Use entered name or generate a random one if empty
      const name = studentName.trim() || generateRandomName();
      
      const participant = await addSessionParticipant(formattedCode, name);
      
      if (!participant) {
        setError('Failed to join session. Please try again.');
        setIsJoining(false);
        return;
      }

      setStudentName(name);
      
      // Check if this is a teaching session
      const presentationData = await getLessonPresentationByCode(formattedCode);
      if (presentationData) {
        setPresentation(presentationData);
        setStep('teaching');
      } else {
        setStep('feedback');
      }
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendFeedback = async (feedbackValue: string) => {
    if (!sessionCode || !studentName) return;
    
    setIsSendingFeedback(true);
    setError('');
    
    try {
      const result = await submitFeedback(sessionCode, studentName, feedbackValue);
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
    if (!question.trim() || !presentation?.id || !studentName) return;
    
    setIsSendingFeedback(true);
    setError('');
    
    try {
      const success = await submitTeachingQuestion(
        presentation.id,
        studentName,
        question.trim()
      );
      
      if (success) {
        setSuccessMessage('Question sent to teacher!');
        setQuestion('');
        setShowQuestionForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to send question. Please try again.');
      }
    } catch (err) {
      console.error('Error sending question:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleTeachingFeedback = async (feedbackType: string) => {
    if (!presentation?.id || !studentName) return;
    
    setIsSendingFeedback(true);
    setError('');
    
    try {
      const success = await submitTeachingFeedback(
        presentation.id,
        studentName,
        feedbackType
      );
      
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

  // Render join form
  if (step === 'join') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <BookOpen className="h-12 w-12 text-indigo-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Join Classroom Session
            </h1>
            
            <form onSubmit={handleJoinSession} className="space-y-6">
              <Input
                label="Class Code"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                disabled={isJoining}
                className="uppercase"
                autoFocus
              />

              <Input
                label="Your Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name or leave blank for random name"
                disabled={isJoining}
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-100 text-red-800 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isJoining || !sessionCode.trim()}
                className="w-full"
                size="lg"
              >
                {isJoining ? 'Joining...' : 'Join Session'}
              </Button>
            </form>
          </div>
        </main>
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
                onClick={() => handleSendFeedback('👍')}
                disabled={isSendingFeedback}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-green-50 border-2 border-green-100 hover:bg-green-100 transition-colors"
              >
                <span className="text-4xl mb-2">👍</span>
                <span className="text-sm font-medium text-green-800">I understand</span>
              </button>
              
              <button
                onClick={() => handleSendFeedback('😕')}
                disabled={isSendingFeedback}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-yellow-50 border-2 border-yellow-100 hover:bg-yellow-100 transition-colors"
              >
                <span className="text-4xl mb-2">😕</span>
                <span className="text-sm font-medium text-yellow-800">I'm confused</span>
              </button>
              
              <button
                onClick={() => handleSendFeedback('❓')}
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
      
      <main className="flex-1 flex flex-col p-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {/* Card content */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 flex-1">
            {currentCard ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentCard.title}
                  </h2>
                  {currentCard.duration && (
                    <p className="text-gray-500">{currentCard.duration}</p>
                  )}
                </div>

                <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                  {typeof currentCard.content === 'string' ? 
                    currentCard.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-4 leading-relaxed">{line || '\u00A0'}</p>
                    )) : 
                    (currentCard.content as string[]).map((line, i) => (
                      <p key={i} className="mb-4 leading-relaxed">{line || '\u00A0'}</p>
                    ))
                  }
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Waiting for teacher to start the lesson...</p>
              </div>
            )}
          </div>
          
          {/* Feedback controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {successMessage && (
              <div className="p-3 mb-4 rounded-lg bg-green-100 text-green-800 text-center">
                {successMessage}
              </div>
            )}
            
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
    </div>
  );
}