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
import { TeachingCardsManager } from "@/components/lesson-details/TeachingCardsManager";
import { WordleConfigCard } from "@/components/lesson-details/WordleConfigCard";
import { StartButtonCard } from "@/components/lesson-details/StartButtonCard";
import { EmptyState } from "@/components/lesson-details/EmptyState";
import { CardSkeleton } from "@/components/lesson-details/CardSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LessonCard, ProcessedLesson } from "../lib/types";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardList, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  addToLearningIntentionsCard, 
  addToSuccessCriteriaCard,
  createSingleObjectiveCard,
  createSingleSuccessCriterionCard
} from "@/lib/cardFactory";

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
  const [activeTab, setActiveTab] = useState("overview");

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
    // Check if we need to add to an existing card or create a single-item card
    if (data.addToCard === "learning_intentions") {
      // Add to a group learning intentions card
      const updatedCards = addToLearningIntentionsCard(selectedCards, data.content.replace('• ', ''));
      setSelectedCards(updatedCards);
      
      toast({
        title: "Added to Learning Intentions",
        description: "The learning intention was added to the group card"
      });
      return;
    } else if (data.addToCard === "success_criteria") {
      // Add to a group success criteria card
      const updatedCards = addToSuccessCriteriaCard(selectedCards, data.content.replace('• ', ''));
      setSelectedCards(updatedCards);
      
      toast({
        title: "Added to Success Criteria",
        description: "The success criterion was added to the group card"
      });
      return;
    } else if (data.addToCard === "separate" && cardType === "objective") {
      // Create a separate card for this specific objective or criterion
      let newCard;
      
      if (data.title === "Learning Intention") {
        newCard = createSingleObjectiveCard(data.content.replace('• ', ''));
      } else if (data.title === "Success Criterion") {
        newCard = createSingleSuccessCriterionCard(data.content.replace('• ', ''));
      } else {
        // Fallback to default objective card
        newCard = {
          id: crypto.randomUUID(),
          type: cardType,
          title: data.title || `New ${cardType} Card`,
          content: data.content || "",
          duration: data.duration || null,
          sectionId: data.sectionId || null,
          activityIndex: data.activityIndex !== undefined ? data.activityIndex : null,
          attachments: [],
        };
      }
      
      setSelectedCards(prev => [...prev, newCard]);
      
      toast({
        title: "Added as Separate Card",
        description: `Created a new card for this ${data.title.toLowerCase()}`
      });
      return;
    } else if (data.addToCard === "materials") {
      // Find existing materials card
      const materialsCardIndex = selectedCards.findIndex(
        card => card.type === "material" && card.title === "Required Materials"
      );

      if (materialsCardIndex >= 0) {
        // Add to existing card
        const updatedCards = [...selectedCards];
        const card = updatedCards[materialsCardIndex];
        
        // Check if this material is already in the card
        if (!card.content.includes(data.content.replace('• ', ''))) {
          updatedCards[materialsCardIndex] = {
            ...card,
            content: card.content + `\n${data.content}`
          };
          setSelectedCards(updatedCards);
          
          toast({
            title: "Added to Materials",
            description: "The material was added to the group card"
          });
        }
        return;
      }
    }

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
      activityIndex: data.activityIndex !== undefined ? data.activityIndex : null,
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="overview" className="flex items-center gap-1.5">
                    <List className="h-4 w-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Cards</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  {/* Card Overview - Simple list of cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Teaching Cards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCards.length === 0 ? (
                        <EmptyState 
                          icon={ClipboardList}
                          title="No cards yet"
                          description="Add content from the lesson to create teaching cards."
                          action={
                            <Button onClick={() => setActiveTab("cards")}>
                              Manage Cards
                            </Button>
                          }
                        />
                      ) : (
                        <div className="space-y-2">
                          {selectedCards.map((card, index) => (
                            <div 
                              key={card.id} 
                              className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                              onClick={() => setActiveTab("cards")}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-6">
                                  {index + 1}.
                                </div>
                                <div className="font-medium truncate">{card.title}</div>
                              </div>
                              {card.duration && (
                                <div className="text-xs text-gray-500">
                                  {card.duration}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
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
                    onStartTeaching={startTeaching}
                    isStartingTeaching={isStartingTeaching}
                    hasCards={selectedCards.length > 0}
                  />
                </TabsContent>

                <TabsContent value="cards">
                  <TeachingCardsManager
                    lesson={lesson}
                    selectedCards={selectedCards}
                    onSave={setSelectedCards}
                  />
                  
                  <div className="mt-6">
                    <StartButtonCard
                      onStartTeaching={startTeaching}
                      isStartingTeaching={isStartingTeaching}
                      hasCards={selectedCards.length > 0}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )
          )}
        </aside>
      </main>
    </div>
  );
}