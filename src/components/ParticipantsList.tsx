import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { SessionParticipant, getParticipantsForSession, subscribeToSessionParticipants } from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';

interface ParticipantsListProps {
  sessionCode: string;
}

export function ParticipantsList({ sessionCode }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadParticipants() {
      try {
        const data = await getParticipantsForSession(sessionCode);
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
    const subscription = subscribeToSessionParticipants(
      sessionCode,
      (newParticipant) => {
        setParticipants(current => [...current, newParticipant]);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionCode]);

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
        <span className="text-sm text-gray-500">
          Total: {participants.length}
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No participants have joined yet
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
    </div>
  );
}