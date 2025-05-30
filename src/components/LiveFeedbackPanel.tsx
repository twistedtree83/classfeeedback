import React, { useState, useEffect } from 'react';
import { Feedback, getFeedbackForSession, subscribeToSessionFeedback } from '../lib/supabaseClient';
import { formatTime, groupFeedbackByType } from '../lib/utils';
import { BarChart3 } from 'lucide-react';

interface LiveFeedbackPanelProps {
  sessionCode: string;
}

export function LiveFeedbackPanel({ sessionCode }: LiveFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'list' | 'chart'>('chart');

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
      <div className="w-full p-6 bg-white rounded-xl shadow-lg">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-lg">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  const feedbackCounts = groupFeedbackByType(feedback);
  const totalFeedback = feedback.length;

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Live Feedback</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-md ${view === 'list' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('chart')}
            className={`p-2 rounded-md ${view === 'chart' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:bg-gray-100'}`}
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
              className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(feedbackCounts['👍'] / totalFeedback) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">😕 Confusion</span>
            <span className="font-medium">{feedbackCounts['😕']}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-yellow-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(feedbackCounts['😕'] / totalFeedback) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">❓ Questions</span>
            <span className="font-medium">{feedbackCounts['❓']}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
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
    </div>
  );
}