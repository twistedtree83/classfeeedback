import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowLeft, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ProcessedLesson } from "../lib/types";
import { supabase } from "../lib/supabase";

export function LessonPlannerPage() {
  const [lessons, setLessons] = useState<ProcessedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing lesson plans
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Keep the full lesson data including ID
        setLessons(data.filter((lesson) => lesson.processed_content !== null));
      }
      setLoading(false);
    };

    fetchLessons();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("lesson_plans")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_plans",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new.processed_content) {
            setLessons((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5">
      <header className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-white/30">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-brand-primary mr-3" />
            <h1 className="text-2xl font-bold text-dark-purple">
              Lesson Planner
            </h1>
            <div className="ml-auto">
              <Button variant="success" asChild>
                <Link to="/planner/create">Create New Lesson</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to=".."
            className="inline-flex items-center text-brand-primary hover:text-dark-purple-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No lesson plans yet.</p>
            <Link
              to="/planner/create"
              className="inline-block mt-4 text-brand-primary hover:text-dark-purple-400 transition-colors"
            >
              Create your first lesson plan
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/planner/${lesson.id}`}
                className="modern-card hover-lift p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-white/30 group"
              >
                <h3 className="text-lg font-semibold mb-2 text-dark-purple group-hover:text-dark-purple-300 transition-colors">
                  {lesson.processed_content?.title || "Untitled Lesson"}
                </h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1 text-deep-sky-blue" />
                    <span>
                      {lesson.processed_content?.duration || "No duration"}
                    </span>
                  </div>
                  {lesson.processed_content?.level && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4 mr-1 text-deep-sky-blue" />
                      <span>{lesson.processed_content.level}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {lesson.processed_content?.objectives
                    ?.slice(0, 2)
                    .map((objective, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        • {objective}
                      </p>
                    ))}
                  {lesson.processed_content?.objectives?.length > 2 && (
                    <p className="text-sm text-harvest-gold">
                      +{lesson.processed_content.objectives.length - 2} more
                      objectives
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}