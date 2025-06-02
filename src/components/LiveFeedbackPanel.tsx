import React, { useState, useEffect } from 'react';
import { Feedback, getFeedbackForSession, subscribeToSessionFeedback } from '../lib/supabaseClient';
import { formatTime, groupFeedbackByType } from '../lib/utils';
import { BarChart3, Users } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui-shadcn/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui-shadcn/skeleton';

interface LiveFeedbackPanelProps {
  sessionCode: string;
}

interface Student {
  name: string;
  joinedAt: string;
}

export function LiveFeedbackPanel({ sessionCode }: LiveFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState("chart");

  // Load initial feedback
  useEffect(() => {
    async function loadFeedback() {
      try {
        const feedbackData = await getFeedbackForSession(sessionCode);
        setFeedback(feedbackData);
      } catch (err) {
        console.error('Error loading feedback:', err);
        setError('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    }
    
    loadFeedback();
  }, [sessionCode]);
  
  // Track unique students
  useEffect(() => {
    const uniqueStudents = new Map<string, string>();
    feedback.forEach(item => {
      if (!uniqueStudents.has(item.student_name)) {
        uniqueStudents.set(item.student_name, item.created_at);
      }
    });
    
    const studentList = Array.from(uniqueStudents).map(([name, joinedAt]) => ({
      name,
      joinedAt
    }));
    
    setStudents(studentList);
  }, [feedback]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToSessionFeedback(
      sessionCode,
      (newFeedback) => {
        setFeedback(currentFeedback => [newFeedback, ...currentFeedback]);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive text-center py-8">
          {error}
        </CardContent>
      </Card>
    );
  }

  const feedbackCounts = groupFeedbackByType(feedback);
  const totalFeedback = feedback.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Live Feedback</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="chart" className="px-2">
                <BarChart3 size={16} />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                List
              </TabsTrigger>
              <TabsTrigger value="students" className="px-2">
                <Users size={16} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {totalFeedback === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No feedback received yet
          </div>
        ) : (
          <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="chart" className="mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">👍 Understanding</span>
                    <span className="font-medium">{feedbackCounts['👍']}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div 
                      className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(feedbackCounts['👍'] / totalFeedback) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">😕 Confusion</span>
                    <span className="font-medium">{feedbackCounts['😕']}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div 
                      className="bg-yellow-500 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(feedbackCounts['😕'] / totalFeedback) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">❓ Questions</span>
                    <span className="font-medium">{feedbackCounts['❓']}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(feedbackCounts['❓'] / totalFeedback) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Total feedback: {totalFeedback}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <div className="overflow-auto max-h-96">
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
                        <td className="px-6 py-4 whitespace-nowrap text-2xl">
                          {item.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="mt-0">
              <div className="overflow-auto max-h-96">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {students.map((student) => (
                      <tr key={student.name} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatTime(student.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Total Students: {students.length}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}