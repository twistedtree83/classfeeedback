import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { 
  SessionParticipant, 
  getParticipantsForSession,
  getPendingParticipantsForSession, 
  subscribeToSessionParticipants,
  subscribeToParticipantStatusUpdates,
  approveParticipant,
  rejectParticipant,
  supabase
} from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';
import { Button } from './ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParticipantsListProps {
  sessionCode: string;
}

export function ParticipantsList({ sessionCode }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [pendingParticipants, setPendingParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("approved");

  // Load initial participants
  useEffect(() => {
    async function loadParticipants() {
      try {
        const [allData, pendingData] = await Promise.all([
          getParticipantsForSession(sessionCode),
          getPendingParticipantsForSession(sessionCode)
        ]);
        
        // Set approved participants
        setParticipants(allData.filter(p => p.status === 'approved' || p.status === undefined));
        
        // Set pending participants
        setPendingParticipants(pendingData);
        
        // If there are pending participants, switch to the pending tab
        if (pendingData.length > 0) {
          setActiveTab("pending");
        }
      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Failed to load participants');
      } finally {
        setLoading(false);
      }
    }
    
    loadParticipants();
  }, [sessionCode]);

  // Subscribe to new participants joining
  useEffect(() => {
    const subscription = subscribeToSessionParticipants(
      sessionCode,
      (newParticipant) => {
        console.log("New participant subscription event:", newParticipant);
        if (newParticipant.status === 'pending') {
          setPendingParticipants(current => {
            // Check if already exists
            if (current.some(p => p.id === newParticipant.id)) {
              return current;
            }
            return [...current, newParticipant];
          });
          
          // Switch to pending tab if it's not active
          if (activeTab !== "pending") {
            setActiveTab("pending");
          }
        } else if (newParticipant.status === 'approved') {
          setParticipants(current => {
            // Check if already exists
            if (current.some(p => p.id === newParticipant.id)) {
              return current;
            }
            return [...current, newParticipant];
          });
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode, activeTab]);

  // Subscribe to status updates
  useEffect(() => {
    const channelId = `participant_status_${sessionCode}_${Math.random().toString(36).substring(2, 9)}`;
    
    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          console.log("Participant status update received:", payload);
          const updatedParticipant = payload.new as SessionParticipant;
          
          // Remove from processing state
          setProcessingIds(current => current.filter(id => id !== updatedParticipant.id));
          
          if (updatedParticipant.status === 'approved') {
            // Remove from pending and add to approved
            setPendingParticipants(current => 
              current.filter(p => p.id !== updatedParticipant.id)
            );
            
            setParticipants(current => {
              // Check if already exists
              if (current.some(p => p.id === updatedParticipant.id)) {
                return current;
              }
              return [...current, updatedParticipant];
            });
          } else if (updatedParticipant.status === 'rejected') {
            // Remove from pending
            setPendingParticipants(current => 
              current.filter(p => p.id !== updatedParticipant.id)
            );
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  const handleApprove = async (participant: SessionParticipant) => {
    console.log("Approving participant:", participant.id);
    setProcessingIds(current => [...current, participant.id]);
    
    try {
      const success = await approveParticipant(participant.id);
      console.log("Approve result:", success);
      
      if (!success) {
        throw new Error("Failed to approve participant");
      }
      
      // Manually update UI state immediately for better UX
      setPendingParticipants(current => current.filter(p => p.id !== participant.id));
      setParticipants(current => [...current, {...participant, status: 'approved'}]);
      
      // Remove from processing even though we'll also do this in the subscription
      setProcessingIds(current => current.filter(id => id !== participant.id));
    } catch (err) {
      console.error('Error approving participant:', err);
      setProcessingIds(current => current.filter(id => id !== participant.id));
    }
  };

  const handleReject = async (participant: SessionParticipant) => {
    console.log("Rejecting participant:", participant.id);
    setProcessingIds(current => [...current, participant.id]);
    
    try {
      const success = await rejectParticipant(participant.id);
      console.log("Reject result:", success);
      
      if (!success) {
        throw new Error("Failed to reject participant");
      }
      
      // Manually update UI state immediately for better UX
      setPendingParticipants(current => current.filter(p => p.id !== participant.id));
      
      // Remove from processing even though we'll also do this in the subscription
      setProcessingIds(current => current.filter(id => id !== participant.id));
    } catch (err) {
      console.error('Error rejecting participant:', err);
      setProcessingIds(current => current.filter(id => id !== participant.id));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-lg">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-lg">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Participants</h2>
          </div>
          
          <TabsList>
            <TabsTrigger value="approved" className="relative">
              Approved
              <span className="ml-1.5">{participants.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingParticipants.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {pendingParticipants.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="approved">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved participants yet
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-24rem)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(participant.joined_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending approvals
            </div>
          ) : (
            <div className="space-y-4">
              {pendingParticipants.map((participant) => (
                <div key={participant.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-medium">{participant.student_name}</div>
                      <div className="text-sm text-gray-500">Joined at {formatTime(participant.joined_at)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        onClick={() => handleApprove(participant)}
                        disabled={processingIds.includes(participant.id)}
                      >
                        {processingIds.includes(participant.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => handleReject(participant)}
                        disabled={processingIds.includes(participant.id)}
                      >
                        {processingIds.includes(participant.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}