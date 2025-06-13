import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLessonPlanById } from '../lib/supabase';
import { createSession } from '../lib/supabase';
import { createLessonPresentation } from '../lib/supabase';
import { generateWordleWord } from '../lib/ai';
import { LessonPlanDisplay } from '../components/LessonPlanDisplay';
import { TeachingCardsManager } from '../components/TeachingCardsManager';
import { Button } from '@/components/ui/Button';
import type { LessonCard, ProcessedLesson } from '../lib/types';
import { Sparkles, ExternalLink, FileText, Send, Loader2 } from 'lucide-react';

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<ProcessedLesson | null>(null);
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordleEnabled, setWordleEnabled] = useState(false);
  const [wordleWord, setWordleWord] = useState('');
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  // Load lesson data
  useEffect(() => {
    const loadLesson = async () => {
      if (!id) return;
      
      try {
        const lessonData = await getLessonPlanById(id);
        if (lessonData?.processed_content) {
          setLesson(lessonData.processed_content);
        } else {
          throw new Error('Lesson data not found');
        }
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Failed to load lesson details');
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [id]);

  // Handle adding cards to the teaching sequence
  const handleAddToTeaching = (
    cardType: 'objective' | 'material' | 'section' | 'activity' | 'topic_background',
    data: any
  ) => {
    // Create a unique ID for the new card
    const newCardId = crypto.randomUUID();
    
    // Create the new card based on the type and data
    const newCard: LessonCard = {
      id: newCardId,
      type: cardType,
      title: data.title || `New ${cardType} Card`,
      content: data.content || '',
      duration: data.duration || null,
      sectionId: data.sectionId || null,
      activityIndex: data.activityIndex !== undefined ? data.activityIndex : null,
      attachments: []
    };
    
    // Add the new card to the selected cards
    setSelectedCards(prev => [...prev, newCard]);
  };

  // Handle saving the list of selected cards
  const handleSaveCards = (cards: LessonCard[]) => {
    setSelectedCards(cards);
  };

  // Generate a wordle word based on the lesson content
  const handleGenerateWordleWord = async () => {
    if (!lesson || !wordleEnabled) return;

    setIsGeneratingWord(true);
    try {
      const generatedWord = await generateWordleWord({
        lessonTitle: lesson.title,
        lessonObjectives: lesson.objectives,
        lessonContent: lesson.summary,
        difficulty: lesson.level?.includes('Grade 1') || lesson.level?.includes('Kindergarten') 
          ? 'elementary' 
          : lesson.level?.includes('Grade 2') || lesson.level?.includes('Grade 3') || lesson.level?.includes('Grade 4') || lesson.level?.includes('Grade 5')
            ? 'middle'
            : 'high'
      });
      
      setWordleWord(generatedWord);
    } catch (err) {
      console.error('Error generating wordle word:', err);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const startTeaching = async () => {
    if (!lesson) return;

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
      // Validate we have cards to teach
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

      console.log("Creating lesson presentation with:", {
        sessionId: session.id,
        sessionCode: session.code,
        lessonId: id,
        cardsCount: selectedCards.length,
        teacherName,
        wordleEnabled,
        wordleWord: wordleEnabled ? wordleWord : null,
      });

      const presentation = await createLessonPresentation(
        session.id,
        session.code,
        id!,
        selectedCards, 
        teacherName,
        wordleEnabled ? wordleWord : null
      );

      if (!presentation) {
        throw new Error("Failed to create lesson presentation");
      }

      navigate(`/teach/${presentation.session_code}`);
    } catch (err: any) {
      console.error("Error starting teaching session:", err);

      let errorMessage = "Failed to start teaching session";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsStartingTeaching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <span className="ml-2 text-lg">Loading lesson details...</span>
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
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/planner" className="text-brand-primary hover:text-dark-purple-400 flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              Back to Lesson Planner
            </Link>
            <h1 className="text-3xl font-bold text-dark-purple mt-2">{lesson.title}</h1>
            <div className="flex items-center text-muted-foreground mt-1">
              <FileText className="h-4 w-4 mr-1" />
              <span className="mr-4">{lesson.level || 'No level specified'}</span>
              <span>{lesson.duration || 'No duration specified'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={startTeaching}
              disabled={isStartingTeaching || selectedCards.length === 0}
              className="bg-harvest-gold hover:bg-harvest-gold/90 text-dark-purple"
              size="lg"
            >
              {isStartingTeaching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Start Teaching
                </>
              )}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red/10 border border-red/20 text-red rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content Column */}
          <div className="lg:col-span-2">
            <div className="glass backdrop-blur-sm border border-white/30 rounded-2xl shadow-large p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-dark-purple flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-harvest-gold" />
                  Lesson Content
                </h2>
              </div>
              
              <LessonPlanDisplay 
                lesson={lesson}
                onAddToTeaching={handleAddToTeaching}
              />
            </div>
          </div>

          {/* Teaching Cards Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="glass backdrop-blur-sm border border-white/30 rounded-2xl shadow-large p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-purple mb-6">Teaching Cards</h2>
                
                <div className="space-y-4 mb-6">
                  <p className="text-muted-foreground">
                    Add cards from the lesson content to create your teaching sequence. 
                    You can reorder them by dragging and customize them as needed.
                  </p>
                  
                  {selectedCards.length === 0 && (
                    <div className="bg-harvest-gold/10 text-harvest-gold p-4 rounded-lg border border-harvest-gold/30">
                      No cards added yet. Click "Add to Teaching" in the lesson content to start building your presentation.
                    </div>
                  )}
                </div>
                
                <TeachingCardsManager
                  lesson={lesson}
                  selectedCards={selectedCards}
                  onSave={handleSaveCards}
                />
              </div>

              <div className="glass backdrop-blur-sm border border-white/30 rounded-2xl shadow-large p-6">
                <h2 className="text-xl font-bold text-dark-purple mb-4">Teaching Options</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="wordle"
                      checked={wordleEnabled}
                      onChange={(e) => setWordleEnabled(e.target.checked)}
                      className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    <label htmlFor="wordle" className="text-gray-700">Enable Wordle game for waiting students</label>
                  </div>
                  
                  {wordleEnabled && (
                    <div className="pl-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={wordleWord}
                          onChange={(e) => setWordleWord(e.target.value.toUpperCase())}
                          maxLength={5}
                          className="border border-gray-300 rounded px-3 py-2 w-32 uppercase"
                          placeholder="WORD"
                        />
                        
                        <Button
                          onClick={handleGenerateWordleWord}
                          disabled={isGeneratingWord}
                          variant="outline"
                          className="text-sm"
                        >
                          {isGeneratingWord ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate Word"
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Enter a 5-letter word related to the lesson, or click "Generate Word" to create one automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}