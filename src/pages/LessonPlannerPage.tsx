import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { LessonPlanUploader } from '../components/LessonPlanUploader';
import { LessonPlanDisplay } from '../components/LessonPlanDisplay';
import type { ProcessedLesson } from '../lib/types';
import { useCallback } from 'react';

export function LessonPlannerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedLesson, setProcessedLesson] = useState<ProcessedLesson | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      // Real processing will happen here through Supabase
      setProcessedLesson(null);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Upload Lesson Plan
              </h2>
              <LessonPlanUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
              />
            </div>
          </div>

          <div>
            {processedLesson && !isProcessing && (
              <LessonPlanDisplay lesson={processedLesson} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}