import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { LessonPlanDisplay } from '../components/LessonPlanDisplay';
import { Button } from '../components/ui/Button';
import type { LessonCard } from '../lib/types';
import { createLessonPresentation, getLessonPresentationByCode } from '../lib/supabaseClient';

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [showTeacherPrompt, setShowTeacherPrompt] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;

      try {
        const { data, fetchError } = await supabase
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

  const handleBeginTeaching = () => {
    setShowTeacherPrompt(true);
  };

  const createCard = (type: string, title: string, content: string, duration?: string | null, sectionId?: string | null, activityIndex?: number | null): LessonCard => {
    return {
      id: crypto.randomUUID(),
      type: type as 'objective' | 'material' | 'section' | 'activity',
      title,
      content,
      duration: duration || null,
      sectionId: sectionId || null,
      activityIndex: typeof activityIndex === 'number' ? activityIndex : null
    };
  };

  const startTeaching = async () => {
    if (!lesson?.processed_content) return;
    if (!teacherName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setIsStartingTeaching(true);
    setError(null);

    try {
      let teachingCards = selectedCards.length > 0 ? [...selectedCards] : [
        // Title card
        createCard(
          'objective',
          lesson.processed_content.title,
          lesson.processed_content.summary,
          lesson.processed_content.duration
        ),
        // Objectives card
        createCard(
          'objective',
          'Learning Objectives',
          lesson.processed_content.objectives.map(obj => `• ${obj}`).join('\n')
        ),
        // Materials card
        createCard(
          'material',
          'Required Materials',
          lesson.processed_content.materials.map(mat => `• ${mat}`).join('\n')
        ),
        // Section cards
        ...lesson.processed_content.sections.flatMap(section => [
          // Section content card
          createCard(
            'section',
            section.title,
            section.content,
            section.duration,
            section.id
          ),
          // Activity cards
          ...section.activities.map((activity, index) => createCard(
            'activity',
            `Activity: ${section.title}`,
            activity,
            null,
            section.id,
            index
          ))
        ])
      ];

      console.log('Formatted teaching cards:', teachingCards);
      
      console.log('Teaching cards being sent to Supabase:', JSON.stringify(teachingCards, null, 2));

      const presentation = await createLessonPresentation(
        lesson.id,
        teachingCards, // Send the full card objects
        teacherName.trim()
      );

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

  const handleAddToTeaching = (type: 'objective' | 'material' | 'section' | 'activity', data: any) => {
    const newCard = createCard(
      type,
      data.title,
      data.content,
      data.duration || null,
      data.sectionId || null,
      typeof data.activityIndex === 'number' ? data.activityIndex : null
    );
    setSelectedCards(prev => [...prev, newCard]);
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
                onClick={handleBeginTeaching}
                variant="outline"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                disabled={isStartingTeaching}
              >
                {isStartingTeaching ? 'Starting...' : 'Begin Teaching'}
              </Button>
              {selectedCards.length > 0 && (
                <div className="text-sm text-gray-500 flex items-center">
                  {selectedCards.length} cards selected
                </div>
              )}
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
          <LessonPlanDisplay 
            lesson={lesson.processed_content}
            onAddToTeaching={handleAddToTeaching}
          />
        ) : (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
            This lesson plan has no content.
          </div>
        )}
        
        {showTeacherPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Enter Teacher Name</h3>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border rounded-lg mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTeacherPrompt(false);
                    setTeacherName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={startTeaching}
                  disabled={!teacherName.trim() || isStartingTeaching}
                >
                  {isStartingTeaching ? 'Starting...' : 'Start Teaching'}
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}