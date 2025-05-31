import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinSessionForm } from '../components/JoinSessionForm';
import { 
  getLessonPresentationByCode, 
  subscribeToLessonPresentation,
  getSessionByCode,
  addSessionParticipant
} from '../lib/supabaseClient';
import type { LessonPresentation } from '../lib/types';

export function StudentTeachingView() {
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [joined, setJoined] = useState(false);

  const currentCard = presentation?.cards?.[presentation.current_card_index];

  useEffect(() => {
    if (!presentation?.session_code || !joined) return;

    const subscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        // Always fetch full presentation data to ensure we have properly parsed cards
        getLessonPresentationByCode(presentation.session_code)
          .then(fullPresentation => {
            if (fullPresentation?.cards) {
              setPresentation(fullPresentation);
            }
          })
          .catch(console.error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [presentation?.session_code, joined]);

  const handleJoinSession = async (code: string, studentName: string) => {
    setLoading(true);
    setError(null);
    setStudentName(studentName);

    try {
      // First check if the session exists and is active
      const session = await getSessionByCode(code);
      if (!session) {
        throw new Error('Session not found or has ended');
      }

      // Add participant to session
      const participant = await addSessionParticipant(code, studentName);
      if (!participant) {
        throw new Error('Failed to join session');
      }
      
      console.log('Found active session:', session);
      
      const presentationData = await getLessonPresentationByCode(code);
      if (!presentationData) {
        throw new Error('Presentation not found');
      }
      
      console.log('Joined presentation:', presentationData);
      if (!presentationData.cards || !Array.isArray(presentationData.cards)) {
        throw new Error('Invalid presentation data');
      }
      
      setPresentation(presentationData);
      setJoined(true);
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!presentation || !currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto">
          <JoinSessionForm onJoinSession={handleJoinSession} />
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Joined as: <span className="font-medium">{studentName}</span>
              <span className="mx-2">•</span>
              Card {presentation.current_card_index + 1} of {presentation.cards.length}
            </div>
            <div className="text-sm text-gray-500">
              Session: <span className="font-mono">{presentation.session_code}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentCard.title}
            </h2>
            {currentCard.duration && (
              <p className="text-gray-500">{currentCard.duration}</p>
            )}
          </div>

          <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
            {currentCard.content.split('\n').map((line, i) => (
              <p key={i} className="mb-4 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}