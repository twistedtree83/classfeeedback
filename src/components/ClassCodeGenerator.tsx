import React from 'react';
import { Button } from './ui/Button';
import { createSession } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ClassCodeGeneratorProps {
  onCodeGenerated: (code: string) => void;
}

export function ClassCodeGenerator({ onCodeGenerated }: ClassCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const getTeacherName = () => {
    if (!user?.user_metadata) return '';
    const { title, full_name } = user.user_metadata;
    return `${title} ${full_name.split(' ').pop()}`; // Use title + last name
  };

  const handleGenerateCode = async () => {
    const teacherName = getTeacherName();
    if (!teacherName) {
      setError('Could not determine teacher name');
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
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

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