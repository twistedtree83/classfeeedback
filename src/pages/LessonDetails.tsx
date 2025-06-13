import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Edit2, Trash2, Brain, FileText, List } from "lucide-react";
import { supabase } from "../lib/supabase/client";
import { LessonPlanDisplay } from "../components/LessonPlanDisplay";
import { TeachingCardsManager } from "../components/TeachingCardsManager";
import { Button } from "../components/ui/Button";
import type { LessonCard } from "../lib/types";
import { createLessonPresentation, createSession } from "../lib/supabase";
import { generateWordleWord } from "../lib/ai";

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [wordleEnabled, setWordleEnabled] = useState(false);
  const [generatingWordleWord, setGeneratingWordleWord] = useState(false);
  const [wordleWord, setWordleWord] = useState<string | null>(null);
  const [customWord, setCustomWord] = useState<string>("");
  const [isEditingCustomWord, setIsEditingCustomWord] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;

      try {
        const { data, error: fetchError } = await supabase
          .from("lesson_plans")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Lesson not found");

        setLesson(data);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm("Are you sure you want to delete this lesson plan?")
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("lesson_plans")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      navigate("/planner");
    } catch (err) {
      console.error("Error deleting lesson:", err);
      setError(err instanceof Error ? err.message : "Failed to delete lesson");
      setIsDeleting(false);
    }
  };

  const handleBeginTeaching = () => {
    startTeaching();
  };

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

  const handleAddToTeaching = (
    type:
      | "objective"
      | "material"
      | "section"
      | "activity"
      | "topic_background",
    data: any
  ) => {
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type,
      title: data.title,
      content: data.content,
      duration: data.duration || null,
      sectionId: data.sectionId || null,
      activityIndex:
        typeof data.activityIndex === "number" ? data.activityIndex : null,
    };

    setSelectedCards((prev) => [...prev, newCard]);
  };

  const generateNewWordleWord = async () => {
    if (!lesson?.processed_content) return;

    setGeneratingWordleWord(true);
    try {
      const word = await generateWordleWord({
        lessonTitle: lesson.processed_content.title,
        lessonObjectives: lesson.processed_content.objectives,
        lessonContent: lesson.processed_content.summary,
        difficulty: lesson.processed_content.level
          ?.toLowerCase()
          .includes("elementary")
          ? "elementary"
          : lesson.processed_content.level?.toLowerCase().includes("high")
          ? "high"
          : "middle",
      });
      setWordleWord(word);
      setIsEditingCustomWord(false);
    } catch (error) {
      console.error("Error generating Wordle word:", error);
      setError("Failed to generate Wordle word. A fallback word will be used.");
    } finally {
      setGeneratingWordleWord(false);
    }
  };

  const handleWordleToggle = async (enabled: boolean) => {
    setWordleEnabled(enabled);

    if (enabled && lesson?.processed_content && !wordleWord) {
      await generateNewWordleWord();
    } else if (!enabled) {
      setWordleWord(null);
      setCustomWord("");
      setIsEditingCustomWord(false);
    }
  };

  const handleCustomWordSubmit = () => {
    const trimmedWord = customWord.trim().toUpperCase();

    // Validate the custom word
    if (trimmedWord.length !== 5) {
      setError("Wordle word must be exactly 5 letters long.");
      return;
    }

    if (!/^[A-Z]+$/.test(trimmedWord)) {
      setError("Wordle word must contain only letters.");
      return;
    }

    setWordleWord(trimmedWord);
    setIsEditingCustomWord(false);
    setError(null);
  };

  const handleCustomWordCancel = () => {
    setCustomWord(wordleWord || "");
    setIsEditingCustomWord(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-sky-blue/5 to-harvest-gold/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <Link
            to="/planner"
            className="inline-flex items-center text-brand-primary hover:text-dark-purple-400 transition-colors duration-200 font-medium group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Lessons
          </Link>
          {lesson && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleBeginTeaching}
                variant="success"
                className="shadow-soft hover:shadow-medium transition-all duration-200"
                disabled={isStartingTeaching || selectedCards.length === 0}
              >
                {isStartingTeaching ? "Starting..." : "Begin Teaching"}
              </Button>
              <Button
                onClick={() => navigate(`/planner/${id}/edit`)}
                variant="outline"
                className="shadow-soft hover:shadow-medium transition-all duration-200"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="shadow-soft hover:shadow-medium transition-all duration-200"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-primary border-t-transparent mb-4"></div>
            <p className="text-brand-primary font-medium">
              Loading lesson details...
            </p>
          </div>
        ) : error ? (
          <div className="glass backdrop-blur-sm border border-red-200 bg-gradient-to-r from-red-50/80 to-red-100/80 text-red-700 p-8 rounded-2xl shadow-large">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-200 rounded-full">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-red-800">
                Error Loading Lesson
              </h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        ) : lesson?.processed_content ? (
          <div className="space-y-10">
            {/* Wordle Configuration */}
            <div className="glass backdrop-blur-sm border border-deep-sky-blue/20 bg-gradient-to-r from-deep-sky-blue/5 to-sea-green/5 rounded-2xl shadow-large overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-deep-sky-blue/20 rounded-xl shadow-soft">
                      <Brain className="h-8 w-8 text-deep-sky-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-dark-purple mb-1">
                        Brains On Wordle
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Educational Word Game
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wordleEnabled}
                      onChange={(e) => handleWordleToggle(e.target.checked)}
                      className="sr-only peer"
                      disabled={generatingWordleWord}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sea-green/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sea-green shadow-inner"></div>
                  </label>
                </div>

                <div className="bg-white/50 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    Enable Brains On Wordle to add an educational word game to
                    your lesson. AI will generate a 5-letter word related to
                    your lesson content for students to guess during the waiting
                    room.
                  </p>
                </div>

                {generatingWordleWord && (
                  <div className="flex items-center gap-3 bg-sea-green/10 rounded-xl p-4 border border-sea-green/20">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-sea-green border-t-transparent"></div>
                    <span className="text-sea-green font-medium">
                      Generating lesson-specific word...
                    </span>
                  </div>
                )}

                {wordleWord && !isEditingCustomWord && (
                  <div className="bg-gradient-to-r from-sea-green/10 to-sea-green/5 border border-sea-green/30 rounded-xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Current Word for This Lesson:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={generateNewWordleWord}
                          variant="outline"
                          size="sm"
                          disabled={generatingWordleWord}
                          className="text-xs border-sea-green/30 text-sea-green hover:bg-sea-green/10 transition-all duration-200"
                        >
                          {generatingWordleWord
                            ? "Generating..."
                            : "🔄 Regenerate"}
                        </Button>
                        <Button
                          onClick={() => {
                            setCustomWord(wordleWord);
                            setIsEditingCustomWord(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs border-sea-green/30 text-sea-green hover:bg-sea-green/10 transition-all duration-200"
                        >
                          ✏️ Edit
                        </Button>
                      </div>
                    </div>
                    <div className="text-center bg-white/70 rounded-lg p-4 mb-3">
                      <p className="text-3xl font-bold text-sea-green tracking-[0.3em] font-mono">
                        {wordleWord}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 text-center">
                      Students will try to guess this word during the waiting
                      room phase.
                    </p>
                  </div>
                )}

                {isEditingCustomWord && (
                  <div className="bg-gradient-to-r from-deep-sky-blue/10 to-deep-sky-blue/5 border border-deep-sky-blue/30 rounded-xl p-6 shadow-soft">
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                      Enter your own 5-letter word:
                    </p>
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={customWord}
                        onChange={(e) =>
                          setCustomWord(e.target.value.toUpperCase())
                        }
                        maxLength={5}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-sky-blue focus:border-transparent font-mono tracking-[0.3em] text-center text-xl font-bold bg-white/80 shadow-inner"
                        placeholder="ENTER"
                        autoFocus
                      />
                      <Button
                        onClick={handleCustomWordSubmit}
                        variant="secondary"
                        size="sm"
                        disabled={customWord.trim().length !== 5}
                        className="px-4 transition-all duration-200"
                      >
                        💾 Save
                      </Button>
                      <Button
                        onClick={handleCustomWordCancel}
                        variant="outline"
                        size="sm"
                        className="border-red/30 text-red hover:bg-red/10 transition-all duration-200"
                      >
                        ❌ Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 bg-white/50 rounded-lg p-3">
                      💡 Word must be exactly 5 letters and contain only
                      alphabetic characters.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* Lesson Plan Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand-primary/20 rounded-xl">
                    <FileText className="h-6 w-6 text-brand-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-brand-primary">
                    Lesson Plan
                  </h2>
                </div>
                <LessonPlanDisplay
                  lesson={lesson.processed_content}
                  onAddToTeaching={handleAddToTeaching}
                />
              </div>

              {/* Teaching Cards Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-deep-sky-blue/20 rounded-xl">
                    <List className="h-6 w-6 text-deep-sky-blue" />
                  </div>
                  <h2 className="text-2xl font-bold text-deep-sky-blue">
                    Teaching Cards
                  </h2>
                </div>
                <TeachingCardsManager
                  lesson={lesson.processed_content}
                  selectedCards={selectedCards}
                  onSave={setSelectedCards}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass backdrop-blur-sm border border-harvest-gold/20 bg-gradient-to-r from-harvest-gold/10 to-harvest-gold/5 text-harvest-gold-800 p-8 rounded-2xl shadow-large">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-harvest-gold/20 rounded-full">
                <FileText className="h-6 w-6 text-harvest-gold" />
              </div>
              <h3 className="font-semibold text-harvest-gold-800">
                No Content Available
              </h3>
            </div>
            <p className="text-harvest-gold-700">
              This lesson plan has no content. Please edit the lesson to add
              content.
            </p>
            <Button
              onClick={() => navigate(`/planner/${id}/edit`)}
              variant="outline"
              className="mt-4 border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Lesson
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-6 glass backdrop-blur-sm border border-red-200 bg-red-50/80 text-red-700 rounded-2xl shadow-soft">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
