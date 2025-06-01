import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { extractTextFromFile } from '../lib/documentParser';
import { aiAnalyzeLesson, generateSuccessCriteria } from '../lib/aiService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { ProcessedLesson } from '../lib/types';
import { LessonPreview } from '../components/LessonPreview';
import { supabase } from '../lib/supabaseClient';

export function CreateLesson() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<ProcessedLesson | null>(null);

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setProcessedContent(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProcessedContent(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Please provide both a title and a file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromFile(selectedFile);
      console.log('Extracted text:', text.slice(0, 500)); // Log first 500 chars
      
      const analyzed = await aiAnalyzeLesson(text, level);      
      if (!analyzed) {
        throw new Error('Failed to analyze lesson plan');
      }
      
      // Generate success criteria based on objectives
      const criteria = await generateSuccessCriteria(analyzed.objectives, level);
      
      const processedLesson: ProcessedLesson = {
        id: crypto.randomUUID(),
        ...analyzed,
        title: title.trim(), // Override the AI-generated title with user's title
        level: level.trim(), // Add the lesson level
        success_criteria: criteria // Add success criteria
      };
      
      console.log('Saving lesson plan:', processedLesson);

      setProcessedContent(processedLesson);

      const { error: saveError } = await supabase
        .from('lesson_plans')
        .insert([{
          id: processedLesson.id,
          title: processedLesson.title,
          processed_content: processedLesson,
          level: level.trim()
        }]);

      if (saveError) {
        console.error('Database error:', saveError);
        throw new Error(`Failed to save lesson plan: ${saveError.message}`);
      }

      // Show preview first
      setProcessedContent(processedLesson);
      
      // Navigate after a short delay to ensure the user sees the preview
      setTimeout(() => {
        navigate(`/planner/${processedLesson.id}`);
      }, 1500);

    } catch (err) {
      console.error('Error processing lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to process lesson plan');
      setProcessedContent(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Lesson Plan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Input
            label="Lesson Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your lesson"
            disabled={isProcessing}
          />

          <div className="space-y-2">
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              Lesson Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select grade level</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload Lesson Plan
            </label>
            <FileUpload
              onFileUpload={handleFileUpload}
              selectedFile={selectedFile}
              onRemoveFile={handleRemoveFile}
              isProcessing={isProcessing}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleProcess}
            disabled={!selectedFile || !title.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Process Lesson Plan'}
          </Button>
        </div>

        <div>
          {processedContent && (
            <LessonPreview lesson={processedContent} />
          )}
          {isProcessing && !processedContent && (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}