import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ParticipantsList } from '../components/ParticipantsList';
import { TeachingFeedbackPanel } from '../components/TeachingFeedbackPanel';
import { 
  getLessonPresentationByCode,
  updateLessonPresentationCardIndex,
  endLessonPresentation
} from '../lib/supabaseClient';
import type { LessonPresentation, LessonCard } from '../lib/types';

export function TeachingModePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [currentCard, setCurrentCard] = useState<LessonCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const loadPresentation = async () => {
      if (!code) return;

      try {
        const data = await getLessonPresentationByCode(code);
        if (!data) throw new Error('Presentation not found');
        
        setPresentation(data);
        setCurrentCard(data.cards[data.current_card_index]);
      } catch (err) {
        console.error('Error loading presentation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    loadPresentation();
  }, [code]);

  const handlePrevious = async () => {
    if (!presentation || presentation.current_card_index <= 0) return;
    
    const newIndex = presentation.current_card_index - 1;
    const success = await updateLessonPresentationCardIndex(presentation.id, newIndex);
    
    if (success) {
      setPresentation({ ...presentation, current_card_index: newIndex });
      setCurrentCard(presentation.cards[newIndex]);
    }
  };

  const handleNext = async () => {
    if (!presentation || presentation.current_card_index >= presentation.cards.length - 1) return;
    
    const newIndex = presentation.current_card_index + 1;
    const success = await updateLessonPresentationCardIndex(presentation.id, newIndex);
    
    if (success) {
      setPresentation({ ...presentation, current_card_index: newIndex });
      setCurrentCard(presentation.cards[newIndex]);
    }
  };

  const handleEndSession = async () => {
    if (!presentation || !window.confirm('Are you sure you want to end this teaching session?')) {
      return;
    }

    const success = await endLessonPresentation(presentation.id);
    if (success) {
      navigate('/planner');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !presentation || !currentCard) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Session not found or has ended'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Teaching Mode
              </h1>
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md font-mono">
                {presentation.session_code}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={showFeedback ? "primary" : "outline"}
                onClick={() => setShowFeedback(!showFeedback)}
                size="sm"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant={showParticipants ? "primary" : "outline"}
                onClick={() => setShowParticipants(!showParticipants)}
                size="sm"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={handleEndSession}
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content area - adjust column span based on sidebar visibility */}
          <div className={`lg:col-span-${showParticipants || showFeedback ? '8' : '12'}`}>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentCard.title}
                </h2>
                {currentCard.duration && (
                  <p className="text-gray-500">{currentCard.duration}</p>
                )}
              </div>

              {/* Content area with proper width and text formatting */}
              <div className="mb-8 text-base text-gray-700 w-full">
                {typeof currentCard.content === 'string' && 
                  currentCard.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-4 leading-relaxed w-full">{line || '\u00A0'}</p>
                  ))
                }
              </div>

              <div className="flex justify-between items-center">
                <Button
                  onClick={handlePrevious}
                  disabled={presentation.current_card_index === 0}
                  variant="outline"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>
                <span className="text-gray-500">
                  {presentation.current_card_index + 1} / {presentation.cards.length}
                </span>
                <Button
                  onClick={handleNext}
                  disabled={presentation.current_card_index === presentation.cards.length - 1}
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
            
            {/* Student join instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <h3 className="font-bold mb-2">Student Join Instructions</h3>
              <p>
                Students can join this session by visiting{' '}
                <span className="font-medium">/student?code={presentation.session_code}</span>{' '}
                or by entering the code: <strong>{presentation.session_code}</strong>
              </p>
            </div>
          </div>

          {/* Sidebar panels */}
          {(showParticipants || showFeedback) && (
            <div className="lg:col-span-4 space-y-6">
              {showFeedback && (
                <TeachingFeedbackPanel presentationId={presentation.id} />
              )}
              
              {showParticipants && (
                <ParticipantsList sessionCode={presentation.session_code} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}