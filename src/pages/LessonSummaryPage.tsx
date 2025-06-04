import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowLeft, 
  Download,
  FileText,
  CalendarClock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui-shadcn/card';
import { Skeleton } from '../components/ui-shadcn/skeleton';
import { formatTime } from '../lib/utils';
import { 
  getSessionByCode, 
  getParticipantsForSession, 
  getTeachingQuestionsForPresentation, 
  getTeachingFeedbackForPresentation,
  getLessonPresentationByCode,
  getLessonPlanById
} from '../lib/supabase';

export function LessonSummaryPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Session data
  const [sessionData, setSessionData] = useState<any>(null);
  const [presentationData, setPresentationData] = useState<any>(null);
  const [lessonData, setLessonData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  
  // Derived metrics
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [totalCards, setTotalCards] = useState<number>(0);
  const [feedbackStats, setFeedbackStats] = useState<{
    understand: number,
    confused: number,
    slower: number,
    total: number,
  }>({ understand: 0, confused: 0, slower: 0, total: 0 });
  
  useEffect(() => {
    const loadSummaryData = async () => {
      if (!code) {
        setError('Session code not found');
        setLoading(false);
        return;
      }
      
      try {
        // Get session data
        const session = await getSessionByCode(code);
        if (!session) {
          throw new Error('Session not found');
        }
        setSessionData(session);
        
        // Get presentation data
        const presentation = await getLessonPresentationByCode(code);
        if (!presentation) {
          throw new Error('Presentation not found');
        }
        setPresentationData(presentation);
        
        // Get lesson data
        if (presentation.lesson_id) {
          const lesson = await getLessonPlanById(presentation.lesson_id);
          if (lesson) {
            setLessonData(lesson);
          }
        }
        
        // Get participants
        const participantsData = await getParticipantsForSession(code);
        setParticipants(participantsData);
        
        // Get questions
        const questionsData = await getTeachingQuestionsForPresentation(presentation.id);
        setQuestions(questionsData);
        
        // Get feedback
        const feedbackData = await getTeachingFeedbackForPresentation(presentation.id);
        setFeedback(feedbackData);
        
        // Calculate metrics
        if (presentation.cards && Array.isArray(presentation.cards)) {
          setTotalCards(presentation.cards.length);
        }
        
        // Calculate session duration
        const endTime = new Date();
        const startTime = new Date(session.created_at);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        setTotalDuration(durationMinutes);
        
        // Calculate feedback stats
        const understandCount = feedbackData.filter(f => f.feedback_type === 'understand').length;
        const confusedCount = feedbackData.filter(f => f.feedback_type === 'confused').length;
        const slowerCount = feedbackData.filter(f => f.feedback_type === 'slower').length;
        
        setFeedbackStats({
          understand: understandCount,
          confused: confusedCount,
          slower: slowerCount,
          total: feedbackData.length
        });
        
      } catch (err) {
        console.error('Error loading summary data:', err);
        setError('Failed to load lesson summary. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSummaryData();
  }, [code]);
  
  const handleExportSummary = () => {
    // Implement CSV or PDF export functionality here
    alert('Export functionality will be implemented in a future update.');
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error}</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {lessonData?.processed_content?.title ? `${lessonData.processed_content.title} - ` : ''}
            Lesson Summary
          </h1>
          <p className="text-gray-500 mt-2">Session {code} • {sessionData?.teacher_name}</p>
        </div>
        
        <Button 
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleExportSummary}
        >
          <Download className="h-4 w-4" />
          Export Summary
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Session Stats */}
        <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-gray-700">
              <Clock className="h-5 w-5 mr-2 text-indigo-600" />
              Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalDuration} minutes
            </div>
            <p className="text-gray-500 text-sm mt-1 flex items-center">
              <CalendarClock className="h-4 w-4 mr-1" />
              {new Date(sessionData?.created_at).toLocaleDateString()} 
              {' • '}
              {new Date(sessionData?.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-gray-700">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Student Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {participants.length} students
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {feedback.length > 0 
                ? `${Math.round((feedback.length / participants.length) * 100)}% feedback participation` 
                : 'No feedback received'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-gray-700">
              <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
              Student Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {questions.length} questions
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {questions.filter(q => q.answered).length} answered
              {' • '}
              {questions.filter(q => !q.answered).length} pending
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Feedback Chart */}
        <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
              Student Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackStats.total === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mb-2" />
                <p>No feedback data collected during this session</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                      <span>Understanding</span>
                    </div>
                    <span className="font-medium">{feedbackStats.understand}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${feedbackStats.total ? (feedbackStats.understand / feedbackStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ThumbsDown className="h-5 w-5 text-yellow-600 mr-2" />
                      <span>Confusion</span>
                    </div>
                    <span className="font-medium">{feedbackStats.confused}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-yellow-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${feedbackStats.total ? (feedbackStats.confused / feedbackStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-2" />
                      <span>Slow Down</span>
                    </div>
                    <span className="font-medium">{feedbackStats.slower}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${feedbackStats.total ? (feedbackStats.slower / feedbackStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total feedback received: {feedbackStats.total}</span>
                    <span>
                      {feedbackStats.total > 0 && participants.length > 0 ? 
                        `Avg ${(feedbackStats.total / participants.length).toFixed(1)} per student` : 
                        'No data'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Student Questions */}
        <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
              Student Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                <p>No questions asked during this session</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-96 pr-2">
                {questions.map(question => (
                  <div 
                    key={question.id} 
                    className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium">{question.student_name}</span>
                      <span className="text-gray-500">{formatTime(question.created_at)}</span>
                    </div>
                    <p className="text-gray-800">{question.question}</p>
                    <div className="mt-2 text-xs flex items-center">
                      <div className={`px-2 py-1 rounded-full ${question.answered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {question.answered ? 
                          <div className="flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span>Answered</span>
                          </div> : 
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Not answered</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Student Participation */}
      <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Users className="h-5 w-5 mr-2 text-indigo-600" />
            Student Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Users className="h-12 w-12 text-gray-300 mb-2" />
              <p>No students joined this session</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions Asked
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map(participant => {
                    const studentFeedbackCount = feedback.filter(f => f.student_name === participant.student_name).length;
                    const studentQuestionsCount = questions.filter(q => q.student_name === participant.student_name).length;
                    
                    return (
                      <tr key={participant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {participant.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(participant.joined_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentFeedbackCount > 0 ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {studentFeedbackCount} feedback
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentQuestionsCount > 0 ? (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {studentQuestionsCount} questions
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Content Coverage */}
      <Card className="shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
            Content Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="font-medium">Cards Covered</div>
                <div className="text-gray-500 text-sm">
                  {presentationData?.current_card_index + 1} of {totalCards} cards
                </div>
              </div>
              <div className="text-lg font-bold">
                {totalCards > 0 ? Math.round(((presentationData?.current_card_index + 1) / totalCards) * 100) : 0}%
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full"
                style={{ width: `${totalCards > 0 ? ((presentationData?.current_card_index + 1) / totalCards) * 100 : 0}%` }}
              ></div>
            </div>
            
            {presentationData?.cards && presentationData.cards.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Cards in This Lesson</h3>
                <div className="space-y-3">
                  {presentationData.cards.slice(0, Math.min(presentationData.current_card_index + 1, presentationData.cards.length)).map((card: any, index: number) => (
                    <div 
                      key={card.id || index}
                      className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{card.title}</div>
                        <div className="text-green-700 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Covered</span>
                        </div>
                      </div>
                      {card.duration && (
                        <div className="text-gray-500 text-xs mt-1">Duration: {card.duration}</div>
                      )}
                    </div>
                  ))}
                  
                  {presentationData.current_card_index < presentationData.cards.length - 1 && (
                    <>
                      <div className="text-gray-500 text-sm py-2">
                        {presentationData.cards.length - presentationData.current_card_index - 1} cards not covered:
                      </div>
                      
                      {presentationData.cards.slice(presentationData.current_card_index + 1).map((card: any, index: number) => (
                        <div 
                          key={card.id || `uncovered-${index}`}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm opacity-70"
                        >
                          <div className="font-medium text-gray-500">{card.title}</div>
                          {card.duration && (
                            <div className="text-gray-400 text-xs mt-1">Duration: {card.duration}</div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-center">
        <Button
          onClick={() => navigate('/planner')}
          size="lg"
        >
          Return to Lesson Planner
        </Button>
      </div>
    </div>
  );
}