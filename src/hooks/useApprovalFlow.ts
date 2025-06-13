import { useState, useEffect, useRef } from 'react';
import { 
  checkParticipantStatus,
  subscribeToParticipantStatus,
  getSessionByCode, 
  addSessionParticipant
} from '../lib/supabase';

interface ApprovalFlowState {
  participantId: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  checking: boolean;
  loading: boolean;
  error: string | null;
  joined: boolean;
  teacherName: string;
}

export function useApprovalFlow(sessionCode: string, studentName: string) {
  const [state, setState] = useState<ApprovalFlowState>({
    participantId: null,
    status: null,
    checking: false,
    loading: false,
    error: null,
    joined: false,
    teacherName: ''
  });

  const processingJoin = useRef(false);
  const processedApproval = useRef(false);

  // Check for previously stored approval
  useEffect(() => {
    if (!sessionCode || processedApproval.current) return;
    
    const approvedKey = `student_approved_${sessionCode}`;
    const approvedData = localStorage.getItem(approvedKey);
    
    if (approvedData) {
      try {
        const parsed = JSON.parse(approvedData);
        if (parsed && parsed.approved && parsed.name) {
          console.log('Found saved approval:', parsed);
          processedApproval.current = true;
          setState(prev => ({
            ...prev,
            joined: true,
            status: 'approved',
            teacherName: parsed.teacherName || ''
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved approval data:', e);
        localStorage.removeItem(approvedKey);
      }
    }
  }, [sessionCode]);

  // Subscribe to approval status updates
  useEffect(() => {
    if (!state.participantId || !sessionCode) return;
    if (processedApproval.current) return;

    console.log(`Setting up participant status subscription for ${state.participantId}`);
    
    // Initial status check
    const checkStatus = async () => {
      setState(prev => ({ ...prev, checking: true }));
      
      try {
        const currentStatus = await checkParticipantStatus(state.participantId!);
        console.log("Current participant status:", currentStatus);
        
        if (currentStatus === 'approved') {
          processApproval();
        } else if (currentStatus === 'rejected') {
          handleRejection();
        } else if (currentStatus === 'pending') {
          setState(prev => ({ ...prev, status: 'pending' }));
        }
      } catch (err) {
        console.error('Error in initial status check:', err);
      } finally {
        setState(prev => ({ ...prev, checking: false }));
      }
    };
    
    checkStatus();
    
    // Set up subscription
    const subscription = subscribeToParticipantStatus(
      state.participantId,
      (newStatus) => {
        console.log(`Received status update: ${newStatus}`);
        
        if (processedApproval.current) return;
        
        setState(prev => ({ ...prev, status: newStatus as 'pending' | 'approved' | 'rejected' }));
        
        if (newStatus === 'approved') {
          processApproval();
        } else if (newStatus === 'rejected') {
          handleRejection();
        }
      }
    );
    
    return () => {
      console.log("Cleaning up participant status subscription");
      subscription.unsubscribe();
    };
  }, [state.participantId, sessionCode]);

  // Handle successful approval
  const processApproval = () => {
    if (processedApproval.current) return;
    
    console.log("Processing approval...");
    processedApproval.current = true;
    
    setState(prev => ({ 
      ...prev, 
      joined: true, 
      status: 'approved',
      loading: false 
    }));
    
    // Save approval in localStorage to persist across page reloads
    const approvalData = {
      approved: true,
      name: studentName,
      teacherName: state.teacherName,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`student_approved_${sessionCode}`, JSON.stringify(approvalData));
  };
  
  // Handle rejection
  const handleRejection = () => {
    setState(prev => ({ 
      ...prev,
      status: 'rejected',
      loading: false,
      joined: false
    }));
    
    processedApproval.current = false;
    processingJoin.current = false;
    localStorage.removeItem(`student_approved_${sessionCode}`);
  };

  // Reset all state
  const resetState = () => {
    setState({
      participantId: null,
      status: null,
      checking: false,
      loading: false,
      error: null,
      joined: false,
      teacherName: ''
    });
    
    processedApproval.current = false;
    processingJoin.current = false;
    localStorage.removeItem(`student_approved_${sessionCode}`);
  };

  // Join a session
  const joinSession = async () => {
    if (processingJoin.current || !sessionCode || !studentName) return;
    
    processingJoin.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log("Joining session with code:", sessionCode.trim().toUpperCase());
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      
      if (!session) {
        throw new Error('Session not found or has ended');
      }

      console.log("Session found:", session);
      setState(prev => ({ ...prev, teacherName: session.teacher_name || '' }));
      
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(),
        studentName.trim()
      );
      
      if (!participant) {
        throw new Error('Failed to join session');
      }
      
      console.log("Added as participant:", participant);
      
      // Store participant id for status checking
      setState(prev => ({ ...prev, participantId: participant.id, status: 'pending' }));
      
      // Update URL with session code and name for easy rejoining
      const url = new URL(window.location.href);
      url.searchParams.set('code', sessionCode.trim().toUpperCase());
      url.searchParams.set('name', studentName.trim());
      window.history.pushState({}, '', url);
      
      processingJoin.current = false;
    } catch (err) {
      console.error('Error joining session:', err);
      setState(prev => ({ 
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to join session',
        loading: false 
      }));
      processingJoin.current = false;
    }
  };

  return {
    ...state,
    joinSession,
    resetState,
    processingJoin: processingJoin.current
  };
}