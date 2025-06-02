import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getSessionByCode, addSessionParticipant, checkParticipantStatus } from '../lib/supabaseClient';
import { generateRandomName } from '../lib/utils';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

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
    if (!participantId || !sessionCode) return;
    
    const checkStatus = async () => {
      setChecking(true);
      try {
        const currentStatus = await checkParticipantStatus(participantId);
        console.log(`Status check for participant ${participantId}:`, currentStatus);
        
        if (currentStatus === 'approved') {
          setStatus('approved');
          // Call onJoinSession after a short delay to show the success message
          setTimeout(() => {
            onJoinSession(sessionCode.trim().toUpperCase(), studentName.trim() || generateRandomName());
          }, 1500);
        } else if (currentStatus === 'rejected') {
          setStatus('rejected');
          setParticipantId(null);
          setError('Your name was not approved by the teacher. Please try again with a different name.');
          setIsJoining(false);
        } else if (currentStatus === 'pending') {
          // Still pending, check again in a few seconds
          setTimeout(() => checkStatus(), 3000);
        }
      } catch (err) {
        console.error('Error checking participant status:', err);
        setIsJoining(false);
      } finally {
        setChecking(false);
      }
    };
    
    checkStatus();
  }, [participantId, sessionCode, studentName, onJoinSession]);

  // Subscribe to participant status changes
  useEffect(() => {
    if (!participantId || !sessionCode) return;
    
    console.log(`Setting up subscription for participant status: ${participantId}`);
    
    const subscription = supabase
      .channel(`participant_status_${participantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `id=eq.${participantId}`,
        },
        (payload) => {
          console.log('Participant status change detected:', payload);
          if (payload.new && payload.new.status) {
            setStatus(payload.new.status as 'pending' | 'approved' | 'rejected');
            
            if (payload.new.status === 'approved') {
              // Call onJoinSession after a short delay to show the success message
              setTimeout(() => {
                onJoinSession(sessionCode.trim().toUpperCase(), studentName.trim() || generateRandomName());
              }, 1500);
            } else if (payload.new.status === 'rejected') {
              setError('Your name was not approved by the teacher. Please try again with a different name.');
              setIsJoining(false);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Participant status subscription status: ${status}`);
      });
    
    return () => {
      console.log("Cleaning up participant status subscription");
      subscription.unsubscribe();
    };
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
      console.log("Checking session:", sessionCode.trim().toUpperCase());
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      
      if (!session) {
        setError('Invalid class code or expired session');
        setIsJoining(false);
        return;
      }
      
      // Use entered name or generate a random one if empty
      const name = studentName.trim() || generateRandomName();
      
      console.log("Adding participant:", { sessionCode: sessionCode.trim().toUpperCase(), name });
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(),
        name
      );
      
      if (!participant) {
        setError('Failed to join session. Please try again.');
        setIsJoining(false);
        return;
      }
      
      console.log("Added participant:", participant);
      
      // Store participant id for status checking
      setParticipantId(participant.id);
      setStatus('pending');
      setStudentName(name);
      
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
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Approved!</h2>
          <p className="text-gray-600 mb-4">
            Your name has been approved by the teacher.
            Joining session...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
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