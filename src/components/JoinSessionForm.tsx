import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getSessionByCode, addSessionParticipant, checkParticipantStatus } from '../lib/supabaseClient';
import { generateRandomName } from '../lib/utils';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface JoinSessionFormProps {
  onJoinSession: (code: string, name: string) => void;
}

export function JoinSessionForm({ onJoinSession }: JoinSessionFormProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [checking, setChecking] = useState(false);
  
  // For polling status
  useEffect(() => {
    if (!participantId) return;
    
    const checkStatus = async () => {
      setChecking(true);
      const currentStatus = await checkParticipantStatus(participantId);
      setChecking(false);
      
      if (currentStatus === 'approved') {
        setStatus('approved');
        // Call onJoinSession after a short delay to show the success message
        setTimeout(() => {
          onJoinSession(sessionCode.trim().toUpperCase(), studentName.trim());
        }, 1500);
      } else if (currentStatus === 'rejected') {
        setStatus('rejected');
        setParticipantId(null);
        setError('Your name was not approved by the teacher. Please try again with a different name.');
      } else {
        // Schedule another check if still pending
        setTimeout(() => checkStatus(), 3000);
      }
    };
    
    checkStatus();
  }, [participantId, sessionCode, studentName, onJoinSession]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');
    setStatus(null);
    
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
      
      // Store participant id for status checking
      setParticipantId(participant.id);
      setStatus('pending');
      setIsJoining(false);
      
    } catch (err) {
      console.error('Error joining session:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsJoining(false);
    }
  };

  if (status === 'pending') {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            {checking ? (
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            ) : (
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">Waiting for Approval</h2>
          <p className="text-gray-600 mb-4">
            Your request to join this session is being reviewed by the teacher.
            Please wait a moment...
          </p>
          <div className="animate-pulse bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg inline-block">
            Waiting for teacher approval...
          </div>
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Approved!</h2>
          <p className="text-gray-600 mb-4">
            Your name has been approved by the teacher.
            Joining session...
          </p>
        </div>
      </div>
    );
  }

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
          <div className="p-3 rounded-lg bg-red-100 text-red-800 text-center flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
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