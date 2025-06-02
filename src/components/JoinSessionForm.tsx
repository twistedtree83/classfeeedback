import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSessionByCode, addSessionParticipant } from '../lib/supabaseClient';
import { generateRandomName } from '../lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui-shadcn/card';

interface JoinSessionFormProps {
  onJoinSession: (code: string, name: string) => void;
}

export function JoinSessionForm({ onJoinSession }: JoinSessionFormProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    setIsJoining(true);
    setError('');
    
    try {
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      
      if (!session) {
        setError('Invalid class code or expired session');
        setIsJoining(false);
        return;
      }
      
      // Use entered name or generate a random one if empty
      const name = studentName.trim() || generateRandomName();
      
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(),
        name
      );
      
      if (!participant) {
        setError('Failed to join session. Please try again.');
        setIsJoining(false);
        return;
      }
      
      toast({
        title: "Success",
        description: `Joined session as ${name}`,
      });
      
      onJoinSession(sessionCode.trim().toUpperCase(), name);
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Join Class Session</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleJoinSession} className="space-y-4">
          <Input
            label="Class Code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            disabled={isJoining}
            className="uppercase"
            autoFocus
          />

          <Input
            label="Your Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your name or leave blank for random name"
            disabled={isJoining}
          />

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-center">
              {error}
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleJoinSession}
          disabled={isJoining || !sessionCode.trim()}
          className="w-full"
          size="lg"
          isLoading={isJoining}
        >
          Join Session
        </Button>
      </CardFooter>
    </Card>
  );
}