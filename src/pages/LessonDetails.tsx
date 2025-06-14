import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getLessonPlanById,
  createSession,
  createLessonPresentation,
} from "../lib/supabase";
import { generateWordleWord } from "../lib/ai";
import { LessonHeader } from "@/components/lesson-details/LessonHeader";
import { LessonPlan } from "@/components/lesson-details/LessonPlan";
import { WordleConfigCard } from "@/components/lesson-details/WordleConfigCard";
import { StartButtonCard } from "@/components/lesson-details/StartButtonCard";
import { EmptyState } from "@/components/lesson-details/EmptyState";
import { CardSkeleton } from "@/components/lesson-details/CardSkeleton";
import type { LessonCard, ProcessedLesson } from "../lib/types";
import { useToast } from "@/components/ui/use-toast";
import { 
  ClipboardList,
  Edit,
  LayoutGrid,
  Grip,
  ArrowUp,
  ArrowDown,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/utils";

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<ProcessedLesson | null>(null);
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordleEnabled, setWordleEnabled] = useState(false);
  const [wordleWord, setWordleWord] = useState("");
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
          throw new Error("Lesson data not found");
        }
      } catch (err) {
        console.error("Error loading lesson:", err);
        setError("Failed to load lesson details");
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [id]);

  // Load saved cards from sessionStorage
  useEffect(() => {
    if (id) {
      const savedCards = sessionStorage.getItem(`lesson_cards_${id}`);
      if (savedCards) {
        try {
          setSelectedCards(JSON.parse(savedCards));
        } catch (e) {
          console.error("Error parsing saved cards:", e);
        }
      }
    }
  }, [id]);

  // Save cards to sessionStorage when they change
  useEffect(() => {
    if (id && selectedCards.length > 0) {
      sessionStorage.setItem(
        `lesson_cards_${id}`,
        JSON.stringify(selectedCards)
      );
    }
  }, [id, selectedCards]);

  // Handle adding cards to the teaching sequence
  const handleAddToTeaching = async (
    cardType:
      | "objective"
      | "material"
      | "section"
      | "activity"
      | "topic_background",
    data: any
  ) => {
    // Create a unique ID for the new card
    const newCardId = crypto.randomUUID();

    // Create the new card based on the type and data
    const newCard: LessonCard = {
      id: newCardId,
      type: cardType,
      title: data.title || `New ${cardType} Card`,
      content: data.content || "",
      duration: data.duration || null,
      sectionId: data.sectionId || null,
      activityIndex:
        data.activityIndex !== undefined ? data.activityIndex : null,
      attachments: [],
    };

    // If this is an activity card, generate an extension activity within the same card
    if (cardType === "activity") {
      try {
        const { generateExtensionActivity } = await import(
          "../lib/ai/extensionActivity"
        );
        const extensionContent = await generateExtensionActivity(
          data.content || "",
          lesson?.title,
          lesson?.level
        );

        // Add extension activity to the same card
        newCard.extensionActivity = extensionContent;
        
        toast({
          title: "Extension Activity Added",
          description: "Fast finisher extension activity has been added to this card",
        });
      } catch (e) {
        console.error("Extension activity generation failed", e);
        // Continue adding the card even if extension generation fails
      }
    }

    setSelectedCards((prev) => [...prev, newCard]);
  };

  // Move a card up or down in the order
  const moveCard = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === selectedCards.length - 1)
    ) {
      return; // Can't move further up/down
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCards = [...selectedCards];
    const card = newCards[index];
    newCards.splice(index, 1);
    newCards.splice(newIndex, 0, card);
    setSelectedCards(newCards);
  };

  // Remove a card from the list
  const removeCard = (index: number) => {
    const newCards = [...selectedCards];
    newCards.splice(index, 1);
    setSelectedCards(newCards);
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
        difficulty:
          lesson.level?.includes("Grade 1") ||
          lesson.level?.includes("Kindergarten")
            ? "elementary"
            : lesson.level?.includes("Grade 2") ||
              lesson.level?.includes("Grade 3") ||
              lesson.level?.includes("Grade 4") ||
              lesson.level?.includes("Grade 5")
            ? "middle"
            : "high",
      });

      setWordleWord(generatedWord);
    } catch (err) {
      console.error("Error generating wordle word:", err);
      toast({
        title: "Error",
        description: "Failed to generate Wordle word",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // Navigate to the card sorter page
  const goToCardSorter = () => {
    navigate(`/card-sorter/${id}`);
  };

  const startTeaching = async () => {
    if (!lesson) return;

    if (!user?.user_metadata?.title || !user?.user_metadata?.full_name) {
      setError("Please set your title and name in your profile first");
      toast({
        title: "Profile Incomplete",
        description: "Please set your title and name in your profile first",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsStartingTeaching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container grid lg:grid-cols-12 gap-6 pt-6 pb-12">
        {/* LEFT: lesson preview */}
        <section className="lg:col-span-8">
          {isLoading ? (
            <>
              <CardSkeleton className="h-40 mb-6" />
              <CardSkeleton className="h-[600px]" />
            </>
          ) : !lesson ? (
            <EmptyState
              icon={ClipboardList}
              title="Lesson Not Found"
              description="We couldn't find the lesson you're looking for."
              action={
                <Link to="/planner">
                  <Button>Return to Planner</Button>
                </Link>
              }
            />
          ) : (
            <>
              <LessonHeader
                lesson={lesson}
                error={error}
                onStartTeaching={startTeaching}
                isStartingTeaching={isStartingTeaching}
                hasCards={selectedCards.length > 0}
              />
              <div className="mt-6">
                <LessonPlan
                  lesson={lesson}
                  setLesson={setLesson}
                  onAddToTeaching={handleAddToTeaching}
                />
              </div>
            </>
          )}
        </section>

        {/* RIGHT: tools */}
        <aside className="lg:col-span-4 lg:sticky lg:top-[72px] lg:h-[calc(100vh-88px)] lg:overflow-y-auto pb-6">
          {isLoading ? (
            <>
              <CardSkeleton className="h-96 mb-6" />
              <CardSkeleton className="h-48" />
            </>
          ) : (
            lesson && (
              <>
                {/* Teaching Cards Card with Card Sorter Link */}
                <Card className="shadow-md mb-6">
                  <CardHeader className="pb-3 flex flex-row justify-between items-center">
                    <CardTitle className="text-xl">Teaching Cards</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={goToCardSorter}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Card Sorter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectedCards.length === 0 ? (
                      <EmptyState 
                        icon={ClipboardList}
                        title="No cards yet"
                        description="Add content from the lesson to create teaching cards."
                        action={
                          <Button onClick={goToCardSorter}>
                            Manage Cards
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          {selectedCards.map((card, index) => (
                            <div 
                              key={card.id} 
                              className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Grip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div className="truncate font-medium text-gray-700">
                                  {card.title}
                                </div>
                                {card.duration && (
                                  <Badge variant="outline" className="hidden sm:inline-flex">
                                    {card.duration}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => moveCard(index, 'up')}
                                  disabled={index === 0}
                                  className="h-7 w-7"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => moveCard(index, 'down')}
                                  disabled={index === selectedCards.length - 1}
                                  className="h-7 w-7"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeCard(index)}
                                  className="h-7 w-7 text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToTeaching("custom", {
                              title: "Custom Card",
                              content: "Enter content here..."
                            })}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Card
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={goToCardSorter}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit All Cards
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <WordleConfigCard
                  wordleEnabled={wordleEnabled}
                  wordleWord={wordleWord}
                  isGeneratingWord={isGeneratingWord}
                  onWordleEnabledChange={setWordleEnabled}
                  onWordleWordChange={setWordleWord}
                  onGenerateWordleWord={handleGenerateWordleWord}
                />

                <StartButtonCard
                  className="mt-6"
                  onStartTeaching={startTeaching}
                  isStartingTeaching={isStartingTeaching}
                  hasCards={selectedCards.length > 0}
                />
              </>
            )
          )}
        </aside>
      </main>
    </div>
  );
}