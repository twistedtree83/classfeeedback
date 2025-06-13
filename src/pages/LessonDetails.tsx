import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLessonPlanById } from '../lib/supabase/lessonPlans';
import { createSession } from '../lib/supabase/sessions';
import { createLessonPresentation } from '../lib/supabase/presentations';
import { useTeachingCardsManager } from '../hooks/useTeachingCardsManager';
import type { LessonPlan } from '../lib/supabase/types';

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordleEnabled, setWordleEnabled] = useState(false);
  const [wordleWord, setWordleWord] = useState('');

  const { selectedCards } = useTeachingCardsManager();

  // Load lesson data
  useEffect(() => {
    const loadLesson = async () => {
      if (!id) return;
      
      try {
        const lessonData = await getLessonPlanById(id);
        setLesson(lessonData);
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Failed to load lesson details');
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [id]);

  const startTeaching = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!lesson?.processed_content) return;

    if (!user?.user_metadata?.title || !user?.user_metadata?.full_name) {
      setError("Please set your title and name in your profile first");
      return;
    }

    setIsStartingTeaching(true);
    setError(null);

    const teacherName = `${
      user.user_metadata.title
    } ${user.user_metadata.full_name.split(" ").pop()}`;

    try {
      // Use the selected cards from the teaching cards manager
      if (selectedCards.length === 0) {
        throw new Error(
          "Please add at least one card to the teaching sequence"
        );
      }

      // Create a session first
      const session = await createSession(teacherName);
      if (!session) {
        throw new Error("Failed to create teaching session");
      }

      // Now create the lesson presentation with all required parameters
      console.log("Creating lesson presentation with:", {
        sessionId: session.id,
        sessionCode: session.code,
        lessonId: lesson.id,
        cardsCount: selectedCards.length,
        teacherName,
        wordleEnabled,
        wordleWord: wordleEnabled ? wordleWord : null,
      });

      const presentation = await createLessonPresentation(
        session.id,
        session.code,
        lesson.id,
        selectedCards, // Pass cards directly as they will be handled in the function
        teacherName,
        wordleEnabled ? wordleWord : null
      );

      if (!presentation) {
        throw new Error("Failed to create lesson presentation");
      }

      navigate(`/teach/${presentation.session_code}`);
    } catch (err: any) {
      console.error("Error starting teaching session:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to start teaching session";
      if (err instanceof Error) {
        if (err.message.includes("Failed to create lesson presentation")) {
          errorMessage =
            "Unable to create lesson presentation. Please try again or contact support.";
        } else if (err.message.includes("Failed to create teaching session")) {
          errorMessage =
            "Unable to create teaching session. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsStartingTeaching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading lesson details...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lesson not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Lesson Overview</h2>
            {lesson.processed_content && (
              <div className="space-y-4">
                <p><strong>Level:</strong> {lesson.level}</p>
                <p><strong>Duration:</strong> {lesson.processed_content.duration}</p>
                {lesson.processed_content.summary && (
                  <div>
                    <strong>Summary:</strong>
                    <p className="mt-2">{lesson.processed_content.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Teaching Options</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wordle"
                  checked={wordleEnabled}
                  onChange={(e) => setWordleEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="wordle">Enable Wordle game</label>
              </div>
              
              {wordleEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Wordle Word (5 letters):
                  </label>
                  <input
                    type="text"
                    value={wordleWord}
                    onChange={(e) => setWordleWord(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="border rounded px-3 py-2 w-32"
                    placeholder="WORD"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
            
            <button
              onClick={startTeaching}
              disabled={isStartingTeaching}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isStartingTeaching ? 'Starting...' : 'Start Teaching'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}