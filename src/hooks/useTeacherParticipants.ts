import { useState, useEffect } from 'react';
import { 
  getParticipantsForSession, 
  getPendingParticipantsForSession, 
  subscribeToSessionParticipants,
  approveParticipant,
  rejectParticipant,
  SessionParticipant
} from '../lib/supabase';

export function useTeacherParticipants(sessionCode: string | undefined) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [pendingParticipants, setPendingParticipants] = useState<SessionParticipant[]>([]);
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
        const pendingData = await getPendingParticipantsForSession(sessionCode);
        setPendingParticipants(pendingData);
        setPendingCount(pendingData.length);
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
        const pendingData = await getPendingParticipantsForSession(sessionCode);
        setPendingParticipants(pendingData);
        setPendingCount(pendingData.length);
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
        
        // Update pending participants
        if (newParticipant.status === 'pending') {
          setPendingParticipants(prev => {
            // Check if this participant is already in the list
            if (prev.some(p => p.id === newParticipant.id)) {
              // Update the existing participant
              return prev.map(p => p.id === newParticipant.id ? newParticipant : p);
            }
            // Add the new participant
            return [...prev, newParticipant];
          });
          setPendingCount(prev => prev + 1);
        } else if (newParticipant.status === 'approved' || newParticipant.status === 'rejected') {
          // Remove from pending list if approved or rejected
          setPendingParticipants(prev => prev.filter(p => p.id !== newParticipant.id));
          setPendingCount(prev => Math.max(0, prev - 1));
        }
        
        // Update all participants list
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
        const approvedParticipant = pendingParticipants.find(p => p.id === participantId);
        if (approvedParticipant) {
          // Remove from pending list
          setPendingParticipants(prev => prev.filter(p => p.id !== participantId));
          // Update status in all participants list
          setParticipants(prev => 
            prev.map(p => p.id === participantId ? { ...p, status: 'approved' } : p)
          );
          // Update pending count
          setPendingCount(prev => Math.max(0, prev - 1));
        }
      }
      return success;
    } catch (err) {
      console.error('Error approving participant:', err);
      return false;
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    }
  };

  const handleRejectParticipant = async (participantId: string) => {
    setProcessingIds(prev => new Set(prev).add(participantId));
    try {
      const success = await rejectParticipant(participantId);
      if (success) {
        // Update local state
        setPendingParticipants(prev => prev.filter(p => p.id !== participantId));
        // Update status in all participants list
        setParticipants(prev => 
          prev.map(p => p.id === participantId ? { ...p, status: 'rejected' } : p)
        );
        // Update pending count
        setPendingCount(prev => Math.max(0, prev - 1));
      }
      return success;
    } catch (err) {
      console.error('Error rejecting participant:', err);
      return false;
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
    pendingParticipants,
    pendingCount,
    processingIds,
    handleApproveParticipant,
    handleRejectParticipant
  };
}