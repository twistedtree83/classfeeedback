import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase/client";
import { LessonPlanDisplay } from "../components/LessonPlanDisplay";
import { TeachingCardsManager } from "../components/TeachingCardsManager";
import { Button } from "../components/ui/Button";
import type { LessonCard } from "../lib/types";
import { createLessonPresentation } from "../lib/supabase";

export function LessonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingTeaching, setIsStartingTeaching] = useState(false);
  const [showTeacherPrompt, setShowTeacherPrompt] = useState(false);
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

      const presentation = await createLessonPresentation(
        lesson.id,
        selectedCards,
        teacherName
      );

      if (!presentation) {
        throw new Error("Failed to create teaching session");
      }

      navigate(`/teach/${presentation.session_code}`);
    } catch (err: any) {
      console.error("Error starting teaching session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start teaching session"
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-sky-blue/5 to-harvest-gold/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/planner"
            className="inline-flex items-center text-brand-primary hover:text-dark-purple-400 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Lessons
          </Link>
          {lesson && (
            <div className="flex gap-3">
              <Button
                onClick={handleBeginTeaching}
                variant="success"
                className="shadow-soft hover:shadow-medium"
                disabled={isStartingTeaching || selectedCards.length === 0}
              >
                {isStartingTeaching ? "Starting..." : "Begin Teaching"}
              </Button>
              <Button
                onClick={() => navigate(`/planner/${id}/edit`)}
                variant="outline"
                className="shadow-soft hover:shadow-medium"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="shadow-soft hover:shadow-medium"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-brand-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="glass backdrop-blur-sm border border-red-200 bg-red-50/80 text-red-700 p-6 rounded-2xl shadow-soft">
            {error}
          </div>
        ) : lesson?.processed_content ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <LessonPlanDisplay
                lesson={lesson.processed_content}
                onAddToTeaching={handleAddToTeaching}
              />
            </div>
            <div>
              <TeachingCardsManager
                lesson={lesson.processed_content}
                selectedCards={selectedCards}
                onSave={setSelectedCards}
              />
            </div>
          </div>
        ) : (
          <div className="glass backdrop-blur-sm border border-harvest-gold-200 bg-harvest-gold-50/80 text-harvest-gold-800 p-6 rounded-2xl shadow-soft">
            This lesson plan has no content.
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
