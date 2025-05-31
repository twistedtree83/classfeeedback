import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { LessonPlanUploader } from '../components/LessonPlanUploader';
import { LessonPlanDisplay } from '../components/LessonPlanDisplay';
import type { ProcessedLesson } from '../lib/types';
import { supabase } from '../lib/supabaseClient';

export function LessonPlannerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedLesson, setProcessedLesson] = useState<ProcessedLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          if (payload.new && payload.new.processed_content) {
            setProcessedLesson(payload.new.processed_content);
            setIsProcessing(false);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleProcessed = useCallback(async (title: string, pdfFile: File) => {
    setIsProcessing(true);
    setError(null);
    setProcessedLesson(null);
    
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('lessonplans')
        .upload(`${Date.now()}-${pdfFile.name}`, pdfFile);

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase
        .from('lesson_plans')
        .insert([{
          title,
          pdf_path: data.path
        }]);

      if (insertError) {
        throw insertError;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while processing the file');
      setIsProcessing(false);
    }
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
        
        {/* Display list of lesson plans here */}
      </main>
    </div>
  );
}