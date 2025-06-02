import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { 
  SessionParticipant, 
  getParticipantsForSession,
  getPendingParticipantsForSession, 
  subscribeToSessionParticipants,
  subscribeToParticipantStatusUpdates,
  approveParticipant,
  rejectParticipant
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

  // Load initial participants
  useEffect(() => {
    async function loadParticipants() {
      try {
        const [allData, pendingData] = await Promise.all([
          getParticipantsForSession(sessionCode),
          getPendingParticipantsForSession(sessionCode)
        ]);
        
        setParticipants(allData.filter(p => p.status === 'approved' || p.status === undefined));
        setPendingParticipants(pendingData);
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
        if (newParticipant.status === 'pending') {
          setPendingParticipants(current => [...current, newParticipant]);
        } else {
          setParticipants(current => [...current, newParticipant]);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  // Subscribe to status updates
  useEffect(() => {
    const subscription = subscribeToParticipantStatusUpdates(
      sessionCode,
      (updatedParticipant) => {
        // Remove from processing state
        setProcessingIds(current => current.filter(id => id !== updatedParticipant.id));
        
        if (updatedParticipant.status === 'approved') {
          // Remove from pending and add to approved
          setPendingParticipants(current => 
            current.filter(p => p.id !== updatedParticipant.id)
          );
          setParticipants(current => [...current, updatedParticipant]);
        } else if (updatedParticipant.status === 'rejected') {
          // Remove from pending
          setPendingParticipants(current => 
            current.filter(p => p.id !== updatedParticipant.id)
          );
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  const handleApprove = async (participant: SessionParticipant) => {
    setProcessingIds(current => [...current, participant.id]);
    try {
      await approveParticipant(participant.id);
      // Status update will be handled by subscription
    } catch (err) {
      console.error('Error approving participant:', err);
      setProcessingIds(current => current.filter(id => id !== participant.id));
    }
  };

  const handleReject = async (participant: SessionParticipant) => {
    setProcessingIds(current => [...current, participant.id]);
    try {
      await rejectParticipant(participant.id);
      // Status update will be handled by subscription
    } catch (err) {
      console.error('Error rejecting participant:', err);
      setProcessingIds(current => current.filter(id => id !== participant.id));
    }
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
      <Tabs defaultValue="approved">
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