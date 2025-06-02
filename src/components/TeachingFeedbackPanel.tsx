import React, { useState, useEffect } from 'react';
import { 
  subscribeToTeachingFeedback, 
  subscribeToTeachingQuestions, 
  getTeachingFeedbackForPresentation,
  getTeachingQuestionsForPresentation,
  markQuestionAsAnswered
} from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart3, List, Clock, Check, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui-shadcn/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui-shadcn/skeleton';
import { useToast } from '@/components/ui/use-toast';

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
  const [activeTab, setActiveTab] = useState("chart");
  const [loading, setLoading] = useState(true);
  const [newQuestionAlert, setNewQuestionAlert] = useState(false);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [feedbackData, questionsData] = await Promise.all([
          getTeachingFeedbackForPresentation(presentationId),
          getTeachingQuestionsForPresentation(presentationId)
        ]);
        
        setFeedback(feedbackData);
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error loading feedback and questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [presentationId]);

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
        
        // Show notification for new questions
        if (activeTab !== 'questions') {
          setNewQuestionAlert(true);
          // Play a subtle notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log("Audio play prevented by browser policy"));

          toast({
            title: "New Question",
            description: `${newQuestion.student_name}: ${newQuestion.question.substring(0, 60)}${newQuestion.question.length > 60 ? '...' : ''}`,
          });
        }
      }
    );
    
    return () => {
      feedbackSubscription.unsubscribe();
      questionSubscription.unsubscribe();
    };
  }, [presentationId, activeTab, toast]);

  // Reset alert when switching to questions view
  useEffect(() => {
    if (activeTab === 'questions') {
      setNewQuestionAlert(false);
    }
  }, [activeTab]);

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
      toast({
        title: "Success",
        description: "Question marked as answered",
      });
      // Update local state to reflect the change
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.id === questionId ? { ...q, answered: true } : q
        )
      );
    } else {
      toast({
        title: "Error",
        description: "Failed to mark question as answered",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Live Feedback
            {newQuestionAlert && (
              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                <Bell className="h-3 w-3 mr-1" />
                New Question
              </span>
            )}
          </CardTitle>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-3 h-9">
              <TabsTrigger value="chart" className="px-2">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="questions" className="px-2 relative">
                <MessageSquare className="h-4 w-4" />
                {newQuestionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {newQuestionsCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="chart" className="mt-0 space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                  <span>Understanding</span>
                </div>
                <span className="font-medium">{feedbackCounts.understand}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
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
              <div className="w-full bg-muted rounded-full h-3">
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
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${feedbackCounts.total ? (feedbackCounts.slower / feedbackCounts.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Total feedback: {feedbackCounts.total}
            </div>

            {/* Quick access to questions if there are any */}
            {questions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                    Questions ({questions.length})
                  </h3>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setActiveTab('questions')}
                  >
                    View All
                  </Button>
                </div>
                {questions.slice(0, 2).map(item => (
                  <div key={item.id} className="text-sm mb-2 p-2 bg-muted/50 rounded">
                    <p className="font-medium">{item.student_name}:</p>
                    <p className="text-muted-foreground truncate">{item.question}</p>
                  </div>
                ))}
                {questions.length > 2 && (
                  <div className="text-sm text-center text-primary">
                    +{questions.length - 2} more questions
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <div className="overflow-auto max-h-96">
              {feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No feedback received yet
                </div>
              ) : (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {feedback.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatTime(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              Other
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="questions" className="mt-0">
            <div className="overflow-auto max-h-96">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions received yet
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-lg border ${item.answered ? 'bg-muted/50 border-muted' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{item.student_name}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(item.created_at)}</div>
                      </div>
                      <p>{item.question}</p>
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
                        <div className="mt-2 text-xs text-muted-foreground flex items-center">
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                          Answered
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}