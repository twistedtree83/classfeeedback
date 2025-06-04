import React, { useState, useEffect } from 'react';
import { 
  subscribeToTeachingFeedback, 
  subscribeToTeachingQuestions, 
  getTeachingFeedbackForPresentation,
  getTeachingQuestionsForPresentation,
  getCardFeedbackByStudent,
  markQuestionAsAnswered
} from '../lib/supabase';
import { formatTime } from '../lib/utils';
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart3, List, Clock, Check, Bell, Users } from 'lucide-react';
import { Button } from './ui/Button';

interface TeachingFeedbackPanelProps {
  presentationId: string;
  currentCardIndex?: number;
}

interface Feedback {
  id: string;
  student_name: string;
  feedback_type: string;
  content: string | null;
  created_at: string;
  card_index?: number;
}

interface Question {
  id: string;
  student_name: string;
  question: string;
  answered: boolean;
  created_at: string;
  card_index?: number;
}

interface StudentFeedbackMap {
  [studentName: string]: {
    feedback_type: string;
    timestamp: string;
  }
}

export function TeachingFeedbackPanel({ presentationId, currentCardIndex }: TeachingFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [view, setView] = useState<'chart' | 'list' | 'questions' | 'students'>('chart');
  const [loading, setLoading] = useState(true);
  const [newQuestionAlert, setNewQuestionAlert] = useState(false);
  const [filterCurrentCard, setFilterCurrentCard] = useState(true);
  const [studentFeedbackMap, setStudentFeedbackMap] = useState<StudentFeedbackMap>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [feedbackData, questionsData] = await Promise.all([
          getTeachingFeedbackForPresentation(presentationId, filterCurrentCard ? currentCardIndex : undefined),
          getTeachingQuestionsForPresentation(presentationId)
        ]);
        
        setFeedback(feedbackData);
        setQuestions(questionsData);
        
        // Build the student feedback map for the current card
        if (currentCardIndex !== undefined) {
          const cardFeedback = await getCardFeedbackByStudent(presentationId, currentCardIndex);
          const feedbackMap: StudentFeedbackMap = {};
          
          cardFeedback.forEach(item => {
            feedbackMap[item.student_name] = {
              feedback_type: item.feedback_type,
              timestamp: item.created_at
            };
          });
          
          setStudentFeedbackMap(feedbackMap);
        }
      } catch (err) {
        console.error('Error loading feedback and questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [presentationId, currentCardIndex, filterCurrentCard]);

  // Subscribe to real-time feedback
  useEffect(() => {
    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        // Only update state if the feedback is for the current card (when filtering)
        if (!filterCurrentCard || newFeedback.card_index === currentCardIndex) {
          setFeedback(prev => {
            // Check if this is an update to existing feedback
            const existingIndex = prev.findIndex(f => 
              f.student_name === newFeedback.student_name && 
              f.card_index === newFeedback.card_index
            );
            
            if (existingIndex >= 0) {
              // Replace the existing feedback
              const updated = [...prev];
              updated[existingIndex] = newFeedback;
              return updated;
            }
            
            // Add new feedback
            return [newFeedback, ...prev];
          });
          
          // Update student feedback map
          if (newFeedback.card_index === currentCardIndex) {
            setStudentFeedbackMap(prev => ({
              ...prev,
              [newFeedback.student_name]: {
                feedback_type: newFeedback.feedback_type,
                timestamp: newFeedback.created_at
              }
            }));
          }
        }
      },
      filterCurrentCard ? currentCardIndex : undefined
    );
    
    return () => {
      feedbackSubscription.unsubscribe();
    };
  }, [presentationId, currentCardIndex, filterCurrentCard]);

  // Subscribe to real-time questions
  useEffect(() => {
    const questionSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        setQuestions(prev => [newQuestion, ...prev]);
        
        // Show notification for new questions
        if (view !== 'questions') {
          setNewQuestionAlert(true);
          // Play a subtle notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log("Audio play prevented by browser policy"));
        }
      },
      filterCurrentCard ? currentCardIndex : undefined
    );
    
    return () => {
      questionSubscription.unsubscribe();
    };
  }, [presentationId, view, currentCardIndex, filterCurrentCard]);

  // Reset alert when switching to questions view
  useEffect(() => {
    if (view === 'questions') {
      setNewQuestionAlert(false);
    }
  }, [view]);

  // Handle card index changes
  useEffect(() => {
    if (currentCardIndex !== undefined && filterCurrentCard) {
      // Reload feedback for the new card
      const loadCardFeedback = async () => {
        try {
          const cardFeedback = await getTeachingFeedbackForPresentation(presentationId, currentCardIndex);
          setFeedback(cardFeedback);
          
          // Build the student feedback map for the current card
          const feedbackMap: StudentFeedbackMap = {};
          cardFeedback.forEach(item => {
            feedbackMap[item.student_name] = {
              feedback_type: item.feedback_type,
              timestamp: item.created_at
            };
          });
          
          setStudentFeedbackMap(feedbackMap);
        } catch (err) {
          console.error('Error loading card feedback:', err);
        }
      };
      
      loadCardFeedback();
    }
  }, [presentationId, currentCardIndex, filterCurrentCard]);

  // Count feedback by type
  const feedbackCounts = {
    understand: feedback.filter(f => f.feedback_type === 'understand').length,
    confused: feedback.filter(f => f.feedback_type === 'confused').length,
    slower: feedback.filter(f => f.feedback_type === 'slower').length,
    total: feedback.length
  };

  // New questions count
  const newQuestionsCount = questions.filter(q => !q.answered).length;
  
  // Handle marking a question as answered
  const handleMarkAsAnswered = async (questionId: string) => {
    const success = await markQuestionAsAnswered(questionId);
    if (success) {
      // Update local state to reflect the change
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.id === questionId ? { ...q, answered: true } : q
        )
      );
      // Check if there are still new questions
      const newQuestionsExist = questions.some(q => !q.answered && q.id !== questionId);
      if (!newQuestionsExist) {
        setNewQuestionAlert(false);
      }
      return true;
    }
    return false;
  };

  // Get unique student names who have provided feedback
  const studentsWithFeedback = Object.keys(studentFeedbackMap);

  if (loading) {
    return (
      <div className="w-full p-4 bg-white rounded-xl">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-3">
        Live Feedback
        {newQuestionAlert && (
          <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <Bell className="h-3 w-3 mr-1" />
            New Question
          </span>
        )}
      </h2>
      
      <div className="flex space-x-2 mb-4">
        <Button
          variant={view === 'chart' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setView('chart')}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'students' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setView('students')}
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'list' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setView('list')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'questions' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setView('questions')}
          className="relative"
        >
          <MessageSquare className="h-4 w-4" />
          {newQuestionsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {newQuestionsCount}
            </span>
          )}
        </Button>
      </div>
      
      <div className="mb-3 flex items-center">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-indigo-600"
            checked={filterCurrentCard}
            onChange={() => setFilterCurrentCard(!filterCurrentCard)}
          />
          <span className="ml-2 text-sm text-gray-700">Show only current card feedback</span>
        </label>
      </div>
      
      {view === 'chart' && (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                <span>Understanding</span>
              </div>
              <span className="font-medium">{feedbackCounts.understand}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${feedbackCounts.total ? (feedbackCounts.understand / feedbackCounts.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <ThumbsDown className="h-5 w-5 text-yellow-600 mr-2" />
                <span>Confusion</span>
              </div>
              <span className="font-medium">{feedbackCounts.confused}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-yellow-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${feedbackCounts.total ? (feedbackCounts.confused / feedbackCounts.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <span>Slow Down</span>
              </div>
              <span className="font-medium">{feedbackCounts.slower}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${feedbackCounts.total ? (feedbackCounts.slower / feedbackCounts.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Total feedback: {feedbackCounts.total}
          </div>

          {/* Quick access to questions if there are any */}
          {questions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-indigo-600" />
                  Questions ({questions.length})
                </h3>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setView('questions')}
                >
                  View All
                </Button>
              </div>
              {questions.slice(0, 2).map(item => (
                <div key={item.id} className="text-sm mb-2 p-2 bg-gray-50 rounded">
                  <p className="font-medium">{item.student_name}:</p>
                  <p className="text-gray-700 truncate">{item.question}</p>
                </div>
              ))}
              {questions.length > 2 && (
                <div className="text-sm text-center text-indigo-600">
                  +{questions.length - 2} more questions
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {view === 'students' && (
        <div className="space-y-4">
          {studentsWithFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No student feedback for this card yet
            </div>
          ) : (
            <div>
              <h3 className="font-medium mb-3">Student Feedback ({studentsWithFeedback.length})</h3>
              <div className="space-y-2">
                {studentsWithFeedback.map(studentName => {
                  const studentFeedback = studentFeedbackMap[studentName];
                  let feedbackIcon;
                  let feedbackText;
                  let bgColor;
                  
                  if (studentFeedback.feedback_type === 'understand') {
                    feedbackIcon = <ThumbsUp className="h-4 w-4 text-green-600" />;
                    feedbackText = "Understands";
                    bgColor = "bg-green-50 border-green-200";
                  } else if (studentFeedback.feedback_type === 'confused') {
                    feedbackIcon = <ThumbsDown className="h-4 w-4 text-yellow-600" />;
                    feedbackText = "Confused";
                    bgColor = "bg-yellow-50 border-yellow-200";
                  } else {
                    feedbackIcon = <Clock className="h-4 w-4 text-blue-600" />;
                    feedbackText = "Slow Down";
                    bgColor = "bg-blue-50 border-blue-200";
                  }
                  
                  return (
                    <div 
                      key={studentName} 
                      className={`p-3 rounded-lg border flex items-center justify-between ${bgColor}`}
                    >
                      <div className="font-medium">{studentName}</div>
                      <div className="flex items-center">
                        <div className="flex items-center text-sm mr-2">
                          {feedbackIcon}
                          <span className="ml-1">{feedbackText}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(studentFeedback.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {view === 'list' && (
        <div className="overflow-auto max-h-96">
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No feedback received yet
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  {!filterCurrentCard && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.feedback_type === 'understand' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Understands
                        </span>
                      ) : item.feedback_type === 'confused' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ThumbsDown className="h-3 w-3 mr-1" /> Confused
                        </span>
                      ) : item.feedback_type === 'slower' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" /> Slow Down
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Other
                        </span>
                      )}
                    </td>
                    {!filterCurrentCard && item.card_index !== undefined && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Card {item.card_index + 1}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {view === 'questions' && (
        <div className="overflow-auto max-h-96">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions received yet
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border ${item.answered ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{item.student_name}</div>
                    <div className="text-xs text-gray-500">{formatTime(item.created_at)}</div>
                  </div>
                  <p className="text-gray-800">{item.question}</p>
                  {!item.answered ? (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm flex items-center"
                        onClick={() => handleMarkAsAnswered(item.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark as Answered
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                      Answered
                    </div>
                  )}
                  {!filterCurrentCard && item.card_index !== undefined && (
                    <div className="mt-1 text-xs text-gray-500">
                      From card {item.card_index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}