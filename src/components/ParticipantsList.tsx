import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { SessionParticipant, getParticipantsForSession, subscribeToSessionParticipants } from '../lib/supabaseClient';
import { formatTime } from '../lib/utils';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui-shadcn/card';
import { Skeleton } from '@/components/ui-shadcn/skeleton';

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
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive text-center py-8">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Participants</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            Total: {participants.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No participants have joined yet
          </div>
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-24rem)]">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {participant.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTime(participant.joined_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}