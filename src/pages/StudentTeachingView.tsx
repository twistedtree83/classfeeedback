import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinSessionForm } from '../components/JoinSessionForm';
import { getLessonPresentationByCode, subscribeToLessonPresentation } from '../lib/supabaseClient';
import type { LessonPresentation, LessonCard } from '../lib/types';

export function StudentTeachingView() {
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<LessonCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!presentation) return;

    const subscription = subscribeToLessonPresentation(
      presentation.session_code,
      (updatedPresentation) => {
        setPresentation(updatedPresentation);
        setCurrentCard(updatedPresentation.cards[updatedPresentation.current_card_index]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [presentation?.session_code]);

  const handleJoinSession = async (code: string, studentName: string) => {
    setLoading(true);
    setError(null);

    try {
      const presentationData = await getLessonPresentationByCode(code);
      if (!presentationData) {
        throw new Error('Session not found or has ended');
      }

      setPresentation(presentationData);
      setCurrentCard(presentationData.cards[presentationData.current_card_index]);
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentCard.title}
            </h2>
            {currentCard.duration && (
              <p className="text-gray-500">{currentCard.duration}</p>
            )}
          </div>

          <div className="prose max-w-none">
            {currentCard.content}
          </div>
        </div>
      </main>
    </div>
  );
}