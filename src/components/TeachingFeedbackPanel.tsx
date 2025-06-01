import React, { useState, useEffect } from 'react';
import { subscribeToTeachingFeedback, subscribeToTeachingQuestions } from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart3, List } from 'lucide-react';
import { Button } from './ui/Button';

interface TeachingFeedbackPanelProps {
  presentationId: string;
}

interface Feedback {
  id: string;
  student_name: string;
  feedback_type: string;
  content: string | null;
  created_at: string;
}

interface Question {
  id: string;
  student_name: string;
  question: string;
  answered: boolean;
  created_at: string;
}

export function TeachingFeedbackPanel({ presentationId }: TeachingFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [view, setView] = useState<'chart' | 'list' | 'questions'>('chart');

  // Subscribe to real-time feedback
  useEffect(() => {
    const feedbackSubscription = subscribeToTeachingFeedback(
      presentationId,
      (newFeedback) => {
        setFeedback(prev => [newFeedback, ...prev]);
      }
    );
    
    const questionSubscription = subscribeToTeachingQuestions(
      presentationId,
      (newQuestion) => {
        setQuestions(prev => [newQuestion, ...prev]);
      }
    );
    
    return () => {
      feedbackSubscription.unsubscribe();
      questionSubscription.unsubscribe();
    };
  }, [presentationId]);

  // Count feedback by type
  const feedbackCounts = {
    understand: feedback.filter(f => f.feedback_type === 'understand').length,
    confused: feedback.filter(f => f.feedback_type === 'confused').length,
    total: feedback.length
  };

  // New questions count
  const newQuestionsCount = questions.filter(q => !q.answered).length;

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Live Feedback</h2>
        
        <div className="flex space-x-2">
          <Button
            variant={view === 'chart' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('chart')}
          >
            <BarChart3 className="h-4 w-4" />
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
      </div>
      
      {view === 'chart' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-lg">Understanding</span>
              </div>
              <span className="font-medium">{feedbackCounts.understand}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${feedbackCounts.total ? (feedbackCounts.understand / feedbackCounts.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <ThumbsDown className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-lg">Confusion</span>
              </div>
              <span className="font-medium">{feedbackCounts.confused}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-yellow-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${feedbackCounts.total ? (feedbackCounts.confused / feedbackCounts.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Total feedback: {feedbackCounts.total}
          </div>
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
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ThumbsDown className="h-3 w-3 mr-1" /> Confused
                        </span>
                      )}
                    </td>
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
                  {!item.answered && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm"
                        onClick={() => {
                          // Mark as answered logic would go here
                          setQuestions(questions.map(q => 
                            q.id === item.id ? {...q, answered: true} : q
                          ));
                        }}
                      >
                        Mark as Answered
                      </Button>
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