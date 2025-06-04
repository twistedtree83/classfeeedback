import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { SessionParticipant, getParticipantsForSession, subscribeToSessionParticipants, approveParticipant } from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';
import { Button } from './ui/Button';

interface ParticipantsListProps {
  sessionCode: string;
}

export function ParticipantsList({ sessionCode }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadParticipants() {
      try {
        const data = await getParticipantsForSession(sessionCode);
        // Filter out duplicates by student name, keeping the most recent entry
        const uniqueParticipants = data.reduce((acc, current) => {
          const existing = acc.find(p => p.student_name === current.student_name);
          if (!existing || new Date(current.joined_at) > new Date(existing.joined_at)) {
            const filtered = acc.filter(p => p.student_name !== current.student_name);
            return [...filtered, current];
          }
          return acc;
        }, [] as SessionParticipant[]);
        setParticipants(uniqueParticipants);
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
    const subscription = subscribeToSessionParticipants( 
      sessionCode,
      (newParticipant) => {
        setParticipants(current => {
          // Remove any existing participant with the same name
          const filtered = current.filter(p => p.student_name !== newParticipant.student_name);
          // Add the new/updated participant
          return [...filtered, newParticipant];
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

  // Separate pending and approved participants
  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const approvedParticipants = participants.filter(p => p.status === 'approved');

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Participants</h2>
        </div>
        <span className="text-sm text-gray-500">
          Total: {participants.length}
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No participants have joined yet
        </div>
      ) : (
        <div className="space-y-6">
          {pendingParticipants.length > 0 && (
            <div>
              <h3 className="font-medium text-yellow-600 mb-3 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Pending Approval ({pendingParticipants.length})
              </h3>
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
                        Action
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
                          <Button
                            onClick={() => handleApproveParticipant(participant.id)}
                            disabled={processingIds.has(participant.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingIds.has(participant.id) ? 'Approving...' : 'Approve'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium text-green-600 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved ({approvedParticipants.length})
            </h3>
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
                  {approvedParticipants.map((participant) => (
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
          </div>
        </div>
      )}
    </div>
  );
}