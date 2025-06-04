import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, GraduationCap, Clock } from 'lucide-react';
import type { ProcessedLesson } from '../lib/types';
import { supabase } from '../lib/supabaseClient';

export function LessonPlannerPage() {
  const [lessons, setLessons] = useState<ProcessedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing lesson plans
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Keep the full lesson data including ID
        setLessons(data.filter(lesson => lesson.processed_content !== null));
      }
      setLoading(false);
    };

    fetchLessons();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('lesson_plans')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_plans'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.processed_content) {
            setLessons(prev => [payload.new.processed_content, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Lesson Planner</h1>
            <div className="ml-auto">
              <Link
                to="/planner/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create New Lesson
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to=".."
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No lesson plans yet.</p>
            <Link
              to="/planner/create"
              className="inline-block mt-4 text-indigo-600 hover:text-indigo-800"
            >
              Create your first lesson plan
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                to={`/planner/${lesson.id}`}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-indigo-200"
              >
                <h3 className="text-lg font-semibold mb-2">{lesson.processed_content.title}</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{lesson.processed_content.duration}</span>
                  </div>
                  {lesson.processed_content.level && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      <span>{lesson.processed_content.level}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {lesson.processed_content.objectives.slice(0, 2).map((objective, i) => (
                    <p key={i} className="text-sm text-gray-500">• {objective}</p>
                  ))}
                  {lesson.processed_content.objectives.length > 2 && (
                    <p className="text-sm text-gray-400">
                      +{lesson.processed_content.objectives.length - 2} more objectives
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}