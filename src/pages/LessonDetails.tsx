import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLessonPlanById, createSession, createLessonPresentation } from '../lib/supabase';
import { generateWordleWord } from '../lib/ai';
import { LessonPlanDisplay } from '../components/LessonPlanDisplay';
import { TeachingCardsManager } from '../components/TeachingCardsManager';
import type { LessonCard, ProcessedLesson } from '../lib/types';
import { BookOpen, ExternalLink, Send, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MainNav } from '@/components/MainNav';

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
      <div className="container flex items-center justify-center min-h-screen py-8">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          <span className="text-lg text-muted-foreground">Loading lesson details...</span>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lesson Not Found</CardTitle>
            <CardDescription>
              We couldn't find the lesson you're looking for.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/planner">Return to Planner</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:flex-[2]">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
              <Link to="/planner">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
            </Button>

            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold leading-tight tracking-tight">{lesson.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                <BookOpen className="h-4 w-4" />
                <span>{lesson.level || 'No level specified'}</span>
                <span>•</span>
                <span>{lesson.duration || 'No duration specified'}</span>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={startTeaching}
                    disabled={isStartingTeaching || selectedCards.length === 0}
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
                </TooltipTrigger>
                <TooltipContent>
                  {selectedCards.length === 0 
                    ? "Add at least one card to start teaching" 
                    : "Start a live teaching session with these cards"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {error && (
            <Card className="mb-6 border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          <LessonPlanDisplay 
            lesson={lesson}
            onAddToTeaching={handleAddToTeaching}
          />
        </div>

        <div className="lg:flex-1">
          <div className="lg:sticky lg:top-16 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Teaching Cards</CardTitle>
                <CardDescription>
                  {selectedCards.length > 0
                    ? `${selectedCards.length} cards ready for presentation`
                    : "Add cards from the lesson to create your presentation"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {selectedCards.length === 0 && (
                  <div className="bg-muted p-6 rounded-lg text-center mb-4">
                    <div className="text-3xl mb-3">📝</div>
                    <p className="text-muted-foreground mb-2">No cards selected yet</p>
                    <p className="text-sm text-muted-foreground">
                      Use the "Add to Teaching" buttons in the lesson content to build your presentation
                    </p>
                  </div>
                )}
                
                <TeachingCardsManager
                  lesson={lesson}
                  selectedCards={selectedCards}
                  onSave={handleSaveCards}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Teaching Options</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="wordle">Waiting Room Wordle Game</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can play Wordle while waiting
                    </p>
                  </div>
                  <Switch 
                    id="wordle"
                    checked={wordleEnabled}
                    onCheckedChange={setWordleEnabled}
                  />
                </div>
                
                {wordleEnabled && (
                  <div className="rounded-md border p-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="wordleWord">Wordle Word (5 letters)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="wordleWord"
                          value={wordleWord}
                          onChange={(e) => setWordleWord(e.target.value.toUpperCase())}
                          maxLength={5}
                          className="uppercase"
                          placeholder="WORD"
                        />
                        
                        <Button
                          onClick={handleGenerateWordleWord}
                          disabled={isGeneratingWord}
                          variant="outline"
                          size="sm"
                        >
                          {isGeneratingWord ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              <span className="sr-only">Generating</span>
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Choose a 5-letter word related to the lesson content
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}