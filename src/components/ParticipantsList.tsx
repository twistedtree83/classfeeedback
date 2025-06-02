import React, { useState, useEffect } from 'react';
import { Users, CheckSquare, X, UserCheck, UserX, Loader2 } from 'lucide-react';
import { SessionParticipant, getParticipantsForSession, subscribeToSessionParticipants, updateParticipantStatus } from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabaseClient';

interface ParticipantsListProps {
  sessionCode: string;
}

export function ParticipantsList({ sessionCode }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadParticipants() {
      try {
        console.log(`Loading participants for session: ${sessionCode}`);
        const data = await getParticipantsForSession(sessionCode);
        console.log(`Loaded ${data.length} participants:`, data);
        setParticipants(data);
      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Failed to load participants');
      } finally {
        setLoading(false);
      }
    }
    
    loadParticipants();
  }, [sessionCode]);

  useEffect(() => {
    console.log(`Setting up participants subscription for session: ${sessionCode}`);
    
    const subscription = subscribeToSessionParticipants(
      sessionCode,
      (participantUpdate) => {
        console.log("Participant update received:", participantUpdate);
        
        setParticipants(current => {
          // Check if this is a new participant or an update to an existing one
          const existingIndex = current.findIndex(p => p.id === participantUpdate.id);
          
          if (existingIndex >= 0) {
            // Update existing participant
            console.log(`Updating existing participant at index ${existingIndex}`);
            const updated = [...current];
            updated[existingIndex] = participantUpdate;
            return updated;
          } else {
            // Add new participant
            console.log('Adding new participant');
            return [...current, participantUpdate];
          }
        });
      }
    );
    
    return () => {
      console.log("Cleaning up participants subscription");
      subscription.unsubscribe();
    };
  }, [sessionCode]);

  const handleApprove = async (participantId: string) => {
    setProcessingIds(prev => [...prev, participantId]);
    try {
      console.log(`Approving participant: ${participantId}`);
      const success = await updateParticipantStatus(participantId, 'approved');
      
      if (success) {
        console.log(`Successfully approved participant: ${participantId}`);
        // Update local state
        setParticipants(current => 
          current.map(p => 
            p.id === participantId ? { ...p, status: 'approved' } : p
          )
        );
      } else {
        console.error(`Failed to approve participant: ${participantId}`);
      }
    } catch (err) {
      console.error('Error approving participant:', err);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== participantId));
    }
  };

  const handleReject = async (participantId: string) => {
    setProcessingIds(prev => [...prev, participantId]);
    try {
      console.log(`Rejecting participant: ${participantId}`);
      const success = await updateParticipantStatus(participantId, 'rejected');
      
      if (success) {
        console.log(`Successfully rejected participant: ${participantId}`);
        // Update local state
        setParticipants(current => 
          current.map(p => 
            p.id === participantId ? { ...p, status: 'rejected' } : p
          )
        );
      } else {
        console.error(`Failed to reject participant: ${participantId}`);
      }
    } catch (err) {
      console.error('Error rejecting participant:', err);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== participantId));
    }
  };

  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const rejectedParticipants = participants.filter(p => p.status === 'rejected');

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Participants</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('pending')}
            className="relative"
          >
            Pending
            {pendingParticipants.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingParticipants.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === 'approved' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('approved')}
          >
            Approved
            <span className="ml-1 text-xs bg-gray-200 text-gray-800 rounded-full px-2">
              {approvedParticipants.length}
            </span>
          </Button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <>
          {pendingParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending participants
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(participant.joined_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(participant.id)}
                            disabled={processingIds.includes(participant.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            {processingIds.includes(participant.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckSquare className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(participant.id)}
                            disabled={processingIds.includes(participant.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'approved' && (
        <>
          {approvedParticipants.length === 0 ? (
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvedParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(participant.joined_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Approved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}