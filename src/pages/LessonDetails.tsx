import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { LessonPlanDisplay } from '../components/LessonPlanDisplay';
import { Button } from '../components/ui/Button';
import type { LessonCard } from '../lib/types';
import { createLessonPresentation, getLessonPresentationByCode } from '../lib/supabaseClient';
import { TeachingCardsManager } from '../components/TeachingCardsManager';

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [showTeachingCards, setShowTeachingCards] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('lesson_plans')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Lesson not found');

        setLesson(data);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this lesson plan?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('lesson_plans')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      navigate('/planner');
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
      setIsDeleting(false);
    }
  };

  const handleStartTeaching = async (cards?: LessonCard[]) => {
    if (!lesson?.processed_content) return;
    
    setIsStartingTeaching(true);
    setError(null);

    try {
      // Use provided cards or create default ones
      const teachingCards = cards || [
        // Title card
        {
          id: crypto.randomUUID(),
          type: 'objective',
          title: lesson.processed_content.title,
          content: lesson.processed_content.summary,
          duration: lesson.processed_content.duration
        },
        // Objectives card
        {
          id: crypto.randomUUID(),
          type: 'objective',
          title: 'Learning Objectives',
          content: lesson.processed_content.objectives.map(obj => `• ${obj}`).join('\n')
        },
        // Materials card
        {
          id: crypto.randomUUID(),
          type: 'material',
          title: 'Required Materials',
          content: lesson.processed_content.materials.map(mat => `• ${mat}`).join('\n')
        },
        // Section cards
        ...lesson.processed_content.sections.flatMap(section => [
          // Section content card
          {
            id: crypto.randomUUID(),
            type: 'section',
            title: section.title,
            content: section.content,
            duration: section.duration,
            sectionId: section.id
          },
          // Activity cards
          ...section.activities.map((activity, index) => ({
            id: crypto.randomUUID(),
            type: 'activity',
            title: `Activity: ${section.title}`,
            content: activity,
            sectionId: section.id,
            activityIndex: index
          }))
        ])
      ];

      const presentation = await createLessonPresentation(lesson.id, teachingCards);
      if (!presentation) {
        throw new Error('Failed to create teaching session');
      }

      navigate(`/teach/${presentation.session_code}`);
    } catch (err) {
      console.error('Error starting teaching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start teaching session');
      setIsStartingTeaching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/planner"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Lessons
          </Link>
          {lesson && (
            <div className="flex gap-2">
              <Button
                onClick={handleStartTeaching}
                variant="outline"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                disabled={isStartingTeaching}
              >
                {isStartingTeaching ? 'Starting...' : 'Begin Teaching'}
              </Button>
              <Button
                onClick={() => setShowTeachingCards(!showTeachingCards)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {showTeachingCards ? 'Hide Teaching Cards' : 'Customize Teaching Cards'}
              </Button>
              <Button
                onClick={() => navigate(`/planner/${id}/edit`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : lesson?.processed_content ? (
          <LessonPlanDisplay lesson={lesson.processed_content} />
        ) : (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
            This lesson plan has no content.
          </div>
        )}
        
        {showTeachingCards && lesson?.processed_content && (
          <div className="mt-8">
            <TeachingCardsManager
              lesson={lesson.processed_content}
              onSave={(cards) => {
                handleStartTeaching(cards);
                setShowTeachingCards(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}