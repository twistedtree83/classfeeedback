import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { uploadLessonPlan } from '../lib/supabaseClient';

interface LessonPlanUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function LessonPlanUploader({ onFileSelect, isProcessing }: LessonPlanUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file?.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    setError('');
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Please provide both a title and a file');
      return;
    }

    try {
      const result = await uploadLessonPlan(selectedFile, title.trim());
      if (result) {
        onFileSelect(selectedFile);
      } else {
        setError('Failed to upload lesson plan');
      }
    } catch (err) {
      console.error('Error uploading lesson plan:', err);
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="w-full">
      <Input
        label="Lesson Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for your lesson"
        className="mb-4"
        disabled={isProcessing}
      />

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600" />
            <span className="font-medium">{selectedFile.name}</span>
            {!isProcessing && (
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your lesson plan PDF here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to select a file
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="mt-4">
          <Button
            onClick={handleUpload}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Process Lesson Plan'}
          </Button>
        </div>
      )}
    </div>
  );
}