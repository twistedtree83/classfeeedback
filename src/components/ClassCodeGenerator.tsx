import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSession } from '../lib/supabaseClient';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui-shadcn/card';
import { useToast } from '@/components/ui/use-toast';

interface ClassCodeGeneratorProps {
  onCodeGenerated: (code: string) => void;
}

export function ClassCodeGenerator({ onCodeGenerated }: ClassCodeGeneratorProps) {
  const [teacherName, setTeacherName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

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
        toast({
          title: "Success",
          description: `Class code generated: ${session.code}`,
        });
      } else {
        setError('Failed to generate class code. Please try again.');
        toast({
          title: "Error",
          description: "Failed to generate class code. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error generating code:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Generate Class Code</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Input
          label="Teacher Name"
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
          placeholder="Enter your name"
          error={error}
          disabled={isGenerating}
        />
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="w-full"
          size="lg"
          isLoading={isGenerating}
        >
          Generate Class Code
        </Button>
      </CardFooter>
    </Card>
  );
}