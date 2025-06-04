import React, { useState, useEffect } from 'react';
import { Feedback, getFeedbackForSession, subscribeToSessionFeedback } from '../lib/supabaseClient';
import { formatTime, groupFeedbackByType } from '../lib/utils';
import { BarChart3, Users } from 'lucide-react';

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
  const [view, setView] = useState<'list' | 'chart' | 'students'>('chart');

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
      <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-teal/20">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-teal/20">
        <div className="text-red text-center">{error}</div>
      </div>
    );
  }

  const feedbackCounts = groupFeedbackByType(feedback);
  const totalFeedback = feedback.length;

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-teal/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal">Live Feedback</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-md ${view === 'list' ? 'bg-teal/10 text-teal' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('students')}
            className={`p-2 rounded-md ${view === 'students' ? 'bg-teal/10 text-teal' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => setView('chart')}
            className={`p-2 rounded-md ${view === 'chart' ? 'bg-teal/10 text-teal' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </div>
      
      {totalFeedback === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No feedback received yet
        </div>
      ) : view === 'chart' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">👍 Understanding</span>
            <span className="font-medium">{feedbackCounts['👍']}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-teal h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(feedbackCounts['👍'] / totalFeedback) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">😕 Confusion</span>
            <span className="font-medium">{feedbackCounts['😕']}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-coral h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(feedbackCounts['😕'] / totalFeedback) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">❓ Questions</span>
            <span className="font-medium">{feedbackCounts['❓']}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-orange h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(feedbackCounts['❓'] / totalFeedback) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Total feedback: {totalFeedback}
          </div>
        </div>
      ) : (
        <div className="overflow-auto max-h-96">
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
                  <td className="px-6 py-4 whitespace-nowrap text-2xl">
                    {item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {view === 'students' && (
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(student.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-center text-sm text-gray-500">
            Total Students: {students.length}
          </div>
        </div>
      )}
    </div>
  );
}