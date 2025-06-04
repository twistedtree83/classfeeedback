import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  HelpCircle, 
  Send, 
  MessageSquare, 
  Bell, 
  X, 
  Split,
  Loader2,
  ArrowLeft,
  CheckCircle,
  User
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { JoinSessionForm } from '../components/JoinSessionForm';
import {
  getLessonPresentationByCode,
  subscribeToLessonPresentation,
  submitTeachingFeedback,
  submitTeachingQuestion,
  getTeacherMessagesForPresentation,
  subscribeToTeacherMessages,
  TeacherMessage
} from '../lib/supabaseClient';
import { sanitizeHtml } from '../lib/utils';
import { generateDifferentiatedContent } from '../lib/aiService';
import { MessagePanel } from '../components/MessagePanel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StudentViewProps {}

export function StudentView({}: StudentViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [presentation, setPresentation] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherMessage, setTeacherMessage] = useState<any>(null);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [viewingDifferentiated, setViewingDifferentiated] = useState(false);
  const [hasDifferentiatedContent, setHasDifferentiatedContent] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  const messageToastRef = useRef<HTMLDivElement>(null);

  // Extract code from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      handleJoinSession(codeParam);
    }
  }, [location]);

  const handleJoinSession = async (code: string, name?: string, avatar?: string) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const presentation = await getLessonPresentationByCode(code);
      
      if (!presentation) {
        setError('Session not found or has ended');
        setLoading(false);
        return;
      }
      
      setPresentation(presentation);
      setTeacherName(presentation.teacher_name || 'Teacher');
      
      // Set current card
      if (presentation.cards && presentation.cards.length > 0) {
        setCurrentCard(presentation.cards[presentation.current_card_index]);
        
        // Check if the current card has differentiated content
        setHasDifferentiatedContent(
          !!presentation.cards[presentation.current_card_index].differentiatedContent
        );
      }
      
      // Set student name and avatar (if provided) and mark as joined
      if (name) {
        setStudentName(name);
      }
      if (avatar) {
        setStudentAvatar(avatar);
      }
      setJoined(true);
      
      // Load existing messages
      const messages = await getTeacherMessagesForPresentation(presentation.id);
      if (messages && messages.length > 0) {
        setAllMessages(messages);
        setNewMessageCount(messages.length);
      }
      
      // Set up message subscription
      subscribeToTeacherMessages(presentation.id, (newMessage) => {
        setAllMessages(prev => [...prev, newMessage]);
        setTeacherMessage(newMessage);
        setNewMessageCount(prev => prev + 1);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play prevented by browser policy"));
      });
      
      // Set up presentation updates subscription
      subscribeToLessonPresentation(code, (updatedPresentation) => {
        setPresentation(updatedPresentation);
        
        // Update current card when it changes
        if (updatedPresentation.current_card_index !== presentation.current_card_index) {
          setCurrentCard(updatedPresentation.cards[updatedPresentation.current_card_index]);
          
          // Reset differentiated view
          setViewingDifferentiated(false);
          
          // Check if the new card has differentiated content
          setHasDifferentiatedContent(
            !!updatedPresentation.cards[updatedPresentation.current_card_index].differentiatedContent
          );
        }
      });
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join session. Please try again.');
    } finally {
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
      
      setSuccessMessage('Feedback sent successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to send feedback');
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
      await submitTeachingQuestion(
        presentation.id,
        studentName,
        question.trim()
      );
      
      setQuestion('');
      setShowQuestionForm(false);
      setSuccessMessage('Question sent successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('Failed to send question');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleGenerateDifferentiated = async () => {
    if (!currentCard || generatingDifferentiated) return;
    
    setGeneratingDifferentiated(true);
    setError(null);
    
    try {
      // Generate differentiated content
      const differentiatedContent = await generateDifferentiatedContent(
        currentCard.content,
        currentCard.type,
        "elementary" // Default level for simplification
      );
      
      // Update the current card with the differentiated content
      const updatedCard = {
        ...currentCard,
        differentiatedContent
      };
      
      // Update presentation state with the updated card
      if (presentation) {
        const updatedCards = [...presentation.cards];
        updatedCards[presentation.current_card_index] = updatedCard;
        
        setPresentation({
          ...presentation,
          cards: updatedCards
        });
        
        setCurrentCard(updatedCard);
        setHasDifferentiatedContent(true);
        setViewingDifferentiated(true);
      }
      
      setSuccessMessage('Simplified version created');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error generating differentiated content:', err);
      setError('Failed to create simplified version');
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  const toggleDifferentiatedView = () => {
    setViewingDifferentiated(!viewingDifferentiated);
  };

  const toggleMessagePanel = () => {
    setShowMessagePanel(!showMessagePanel);
    if (!showMessagePanel) {
      setNewMessageCount(0);
    }
    setTeacherMessage(null);
  };

  // Helper function to generate random name
  const generateRandomName = () => {
    const adjectives = ['Happy', 'Clever', 'Quick', 'Bright', 'Smart'];
    const nouns = ['Student', 'Learner', 'Scholar', 'Thinker', 'Explorer'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdjective}${randomNoun}`;
  };

  // If not joined, show join form
  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <JoinSessionForm 
          onJoinSession={(code, name, avatar) => {
            setStudentName(name || generateRandomName());
            setStudentAvatar(avatar || null);
            handleJoinSession(code, name || generateRandomName(), avatar);
          }} 
        />
      </div>
    );
  }

  // Determine content to display based on differentiated view
  const cardContent = viewingDifferentiated && currentCard?.differentiatedContent
    ? currentCard.differentiatedContent
    : currentCard?.content;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-3 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {studentAvatar ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={studentAvatar} alt={studentName} />
                <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <User size={20} className="text-indigo-600" />
            )}
            <span className="font-medium">{studentName}</span>
            <span className="ml-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
              {presentation?.session_code}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMessagePanel}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              {newMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newMessageCount}
                </span>
              )}
            </button>
          </div>
        </div>
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
            onClick={() => setTeacherMessage(null)}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <main className="flex-1 flex">
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
          {currentCard && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(cardContent || '') }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => handleTeachingFeedback('understand')}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px]"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              I Understand
            </Button>

            <Button
              onClick={() => handleTeachingFeedback('confused')}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px]"
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              I'm Confused
            </Button>

            <Button
              onClick={() => setShowQuestionForm(true)}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px]"
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Ask Question
            </Button>

            {hasDifferentiatedContent ? (
              <Button
                onClick={toggleDifferentiatedView}
                disabled={isSendingFeedback}
                variant="outline"
                className="flex-1 max-w-[200px]"
              >
                <Split className="h-5 w-5 mr-2" />
                {viewingDifferentiated ? 'View Original' : 'View Simplified'}
              </Button>
            ) : (
              <Button
                onClick={handleGenerateDifferentiated}
                disabled={isSendingFeedback || generatingDifferentiated}
                variant="outline"
                className="flex-1 max-w-[200px]"
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