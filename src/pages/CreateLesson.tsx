import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { extractTextFromFile } from '../lib/documentParser';
import { aiAnalyzeLesson } from '../lib/aiService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { ProcessedLesson } from '../lib/types';
import { supabase } from '../lib/supabaseClient';

export function CreateLesson() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
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
      const analyzed = await aiAnalyzeLesson(text);
      
      const processedLesson: ProcessedLesson = {
        title: title.trim(),
        ...analyzed
      };

      setProcessedContent(processedLesson);

      const { error: saveError } = await supabase
        .from('lesson_plans')
        .insert([{
          title: processedLesson.title,
          processed_content: processedLesson
        }]);

      if (saveError) {
        throw saveError;
      }

      navigate('/planner');
    } catch (err) {
      console.error('Error processing lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to process lesson plan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Lesson Plan</h1>

      <div className="space-y-6">
        <Input
          label="Lesson Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your lesson"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload Lesson Plan
          </label>
          <FileUpload
            onFileUpload={handleFileUpload}
            selectedFile={selectedFile}
            onRemoveFile={handleRemoveFile}
            isProcessing={isProcessing}
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
    </div>
  );
}