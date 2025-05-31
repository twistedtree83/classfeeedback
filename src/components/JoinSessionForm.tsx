import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getSessionByCode, addSessionParticipant } from '../lib/firebaseClient';
import { generateRandomName } from '../lib/utils';

interface JoinSessionFormProps {
  onJoinSession: (code: string, name: string) => void;
}

export function JoinSessionForm({ onJoinSession }: JoinSessionFormProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

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
      
      onJoinSession(sessionCode.trim().toUpperCase(), name);
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Join Class Session</h2>
      
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
          <div className="p-3 rounded-lg bg-red-100 text-red-800 text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isJoining || !sessionCode.trim()}
          className="w-full"
          size="lg"
        >
          {isJoining ? 'Joining...' : 'Join Session'}
        </Button>
      </form>
    </div>
  );
}