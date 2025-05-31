import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { createSession } from '../lib/firebaseClient';

interface ClassCodeGeneratorProps {
  onCodeGenerated: (code: string) => void;
}

export function ClassCodeGenerator({ onCodeGenerated }: ClassCodeGeneratorProps) {
  const [teacherName, setTeacherName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateCode = async () => {
    if (!teacherName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const session = await createSession(teacherName);
      if (session) {
        onCodeGenerated(session.code);
      } else {
        setError('Failed to generate class code. Please try again.');
      }
    } catch (err) {
      console.error('Error generating code:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Class Code</h2>
      
      <div className="space-y-4">
        <Input
          label="Teacher Name"
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
          placeholder="Enter your name"
          error={error}
          disabled={isGenerating}
        />

        <Button
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Class Code'}
        </Button>
      </div>
    </div>
  );
}