import { useState, useEffect } from 'react';
import { 
  getParticipantsForSession, 
  getPendingParticipantsForSession, 
  subscribeToSessionParticipants,
  approveParticipant,
  SessionParticipant
} from '../lib/supabase';

export function useTeacherParticipants(sessionCode: string | undefined) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Load initial participants and set up polling for pending
  useEffect(() => {
    if (!sessionCode) return;
    
    const loadParticipants = async () => {
      try {
        // Get all participants
        const participantsData = await getParticipantsForSession(sessionCode);
        setParticipants(participantsData);
        
        // Check for pending participants
        const pendingParticipants = await getPendingParticipantsForSession(sessionCode);
        setPendingCount(pendingParticipants.length);
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    };
    
    // Initial load
    loadParticipants();
    
    // Set up polling for pending participants
    const checkPendingInterval = setInterval(async () => {
      if (!sessionCode) return;
      
      try {
        const pendingParticipants = await getPendingParticipantsForSession(sessionCode);
        setPendingCount(pendingParticipants.length);
      } catch (error) {
        console.error('Error checking pending participants:', error);
      }
    }, 5000);
    
    return () => {
      clearInterval(checkPendingInterval);
    };
  }, [sessionCode]);

  // Subscribe to real-time participant updates
  useEffect(() => {
    if (!sessionCode) return;

    const subscription = subscribeToSessionParticipants(
      sessionCode,
      (newParticipant) => {
        console.log("Participant update received:", newParticipant);
        
        if (newParticipant.status === 'pending') {
          // If a new pending participant joins, increment count
          setPendingCount(prev => prev + 1);
        } else if (newParticipant.status === 'approved') {
          // If a participant gets approved, decrement pending count
          setPendingCount(prev => Math.max(0, prev - 1));
        }
        
        setParticipants(current => {
          // Check if this is an update to an existing participant
          const index = current.findIndex(p => p.id === newParticipant.id);
          if (index >= 0) {
            // Update the existing participant
            const updated = [...current];
            updated[index] = newParticipant;
            return updated;
          }
          // Add new participant
          return [...current, newParticipant];
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  const handleApproveParticipant = async (participantId: string) => {
    setProcessingIds(prev => new Set(prev).add(participantId));
    try {
      const success = await approveParticipant(participantId);
      if (success) {
        // Update local state
        setParticipants(prev => 
          prev.map(p => p.id === participantId ? { ...p, status: 'approved' } : p).filter((p, i, arr) => 
            arr.findIndex(x => x.student_name === p.student_name) === i
          )
        );
        // Update pending count
        setPendingCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error approving participant:', err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    }
  };

  return {
    participants,
    pendingCount,
    processingIds,
    handleApproveParticipant
  };
}