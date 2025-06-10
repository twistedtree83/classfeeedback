import React from "react";
import type { ProcessedLesson } from "../lib/types";
import {
  Clock,
  FileText,
  List,
  Target,
  CheckSquare,
  Plus,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "./ui/Button";
import { sanitizeHtml } from "../lib/utils";

interface LessonPlanDisplayProps {
  lesson: ProcessedLesson;
  onAddToTeaching?: (
    cardType:
      | "objective"
      | "material"
      | "section"
      | "activity"
      | "topic_background",
    data: any
  ) => void;
}

export function LessonPlanDisplay({
  lesson,
  onAddToTeaching,
}: LessonPlanDisplayProps) {
  return (
    <div className="glass backdrop-blur-sm border border-white/20 rounded-2xl shadow-large p-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-4">
            {lesson.title}
          </h2>

          <div
            className="text-muted-foreground leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.summary) }}
          ></div>

          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            <div className="flex items-center bg-deep-sky-blue/10 px-4 py-2 rounded-full">
              <Clock className="h-5 w-5 mr-2 text-deep-sky-blue" />
              <span className="font-medium">{lesson.duration}</span>
            </div>

            {lesson.level && (
              <div className="flex items-center bg-harvest-gold/10 px-4 py-2 rounded-full">
                <GraduationCap className="h-5 w-5 mr-2 text-harvest-gold" />
                <span className="font-medium">Level: {lesson.level}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Intentions Section */}
      <div className="glass-card p-6 border border-dark-purple/20 bg-dark-purple/5">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-dark-purple/20 rounded-xl mr-3">
            <Target className="h-6 w-6 text-dark-purple" />
          </div>
          <h3 className="text-xl font-semibold text-dark-purple">
            Learning Intentions
          </h3>
        </div>
        <div className="space-y-4">
          <ul className="space-y-3">
            {lesson.objectives
              .filter((obj) => obj.trim())
              .map((objective, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-background/60 rounded-xl border border-white/30"
                >
                  <div className="w-2 h-2 bg-dark-purple rounded-full mt-2 flex-shrink-0"></div>
                  <span
                    className="text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(objective),
                    }}
                  ></span>
                </li>
              ))}
          </ul>

          {onAddToTeaching && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const content = lesson.objectives
                  .map((obj) => `• ${obj}`)
                  .join("\n");
                onAddToTeaching("objective", {
                  title: "Learning Intentions",
                  content,
                });
              }}
              className="mt-4 border-dark-purple/30 text-dark-purple hover:bg-dark-purple/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Teaching
            </Button>
          )}

          {/* Success Criteria */}
          {lesson.success_criteria && lesson.success_criteria.length > 0 && (
            <div className="mt-6 p-4 bg-sea-green/5 rounded-xl border border-sea-green/20">
              <h4 className="font-semibold text-sea-green flex items-center mb-3">
                <CheckSquare className="h-5 w-5 mr-2" />
                Success Criteria
              </h4>
              <ul className="space-y-2">
                {lesson.success_criteria
                  .filter((criteria) => criteria.trim())
                  .map((criteria, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-2 bg-background/40 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-sea-green rounded-full mt-2 flex-shrink-0"></div>
                      <span
                        className="text-foreground text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(criteria),
                        }}
                      ></span>
                    </li>
                  ))}
              </ul>
              {onAddToTeaching && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAddToTeaching("objective", {
                      title: "Success Criteria",
                      content: (lesson.success_criteria || [])
                        .map((sc) => `• ${sc}`)
                        .join("\n"),
                    })
                  }
                  className="mt-3 border-sea-green/30 text-sea-green hover:bg-sea-green/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Teaching
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Topic Background Section */}
      {lesson.topic_background && (
        <div className="glass-card p-6 border border-bice-blue/20 bg-bice-blue/5">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-bice-blue/20 rounded-xl mr-3">
              <BookOpen className="h-6 w-6 text-bice-blue" />
            </div>
            <h3 className="text-xl font-semibold text-bice-blue">
              Topic Background
            </h3>
          </div>
          <div className="space-y-4">
            <div
              className="p-4 bg-background/60 rounded-xl border border-white/30 text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(lesson.topic_background),
              }}
            ></div>
            {onAddToTeaching && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onAddToTeaching("topic_background", {
                    title: "Topic Background",
                    content: lesson.topic_background,
                  })
                }
                className="border-bice-blue/30 text-bice-blue hover:bg-bice-blue/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Teaching
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Materials Section */}
      <div className="glass-card p-6 border border-harvest-gold/20 bg-harvest-gold/5">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-harvest-gold/20 rounded-xl mr-3">
            <FileText className="h-6 w-6 text-harvest-gold" />
          </div>
          <h3 className="text-xl font-semibold text-harvest-gold">
            Materials Needed
          </h3>
        </div>
        <div className="space-y-4">
          <ul className="space-y-2">
            {lesson.materials
              .filter((material) => material.trim())
              .map((material, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-background/60 rounded-xl border border-white/30"
                >
                  <div className="w-2 h-2 bg-harvest-gold rounded-full mt-2 flex-shrink-0"></div>
                  <span
                    className="text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(material) }}
                  ></span>
                </li>
              ))}
          </ul>
          {onAddToTeaching && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onAddToTeaching("material", {
                  title: "Required Materials",
                  content: lesson.materials.map((mat) => `• ${mat}`).join("\n"),
                })
              }
              className="border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Teaching
            </Button>
          )}
        </div>
      </div>

      {/* Lesson Sections */}
      <div className="glass-card p-6 border border-deep-sky-blue/20 bg-deep-sky-blue/5">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-deep-sky-blue/20 rounded-xl mr-3">
            <List className="h-6 w-6 text-deep-sky-blue" />
          </div>
          <h3 className="text-xl font-semibold text-deep-sky-blue">
            Lesson Sections
          </h3>
        </div>
        <div className="space-y-6">
          {lesson.sections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="glass-card p-6 border border-white/30 bg-background/60 rounded-xl hover:shadow-medium transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h4>
                <span className="bg-deep-sky-blue/10 text-deep-sky-blue px-3 py-1 rounded-full text-sm font-medium">
                  {section.duration}
                </span>
              </div>
              <div
                className="text-muted-foreground leading-relaxed mb-4"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(section.content),
                }}
              ></div>
              {onAddToTeaching && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAddToTeaching("section", {
                      title: section.title,
                      content: section.content,
                      duration: section.duration,
                      sectionId: section.id,
                    })
                  }
                  className="mb-4 border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section to Teaching
                </Button>
              )}

              {/* Activities */}
              {section.activities.length > 0 && (
                <div className="mt-4 p-4 bg-white/40 rounded-xl border border-white/40">
                  <h5 className="font-semibold text-foreground mb-3 flex items-center">
                    <div className="w-2 h-2 bg-deep-sky-blue rounded-full mr-2"></div>
                    Activities
                  </h5>
                  <ul className="space-y-2">
                    {section.activities
                      .filter((activity) => activity.trim())
                      .map((activity, index) => (
                        <li
                          key={index}
                          className="flex items-start justify-between gap-3 p-2 bg-background/60 rounded-lg"
                        >
                          <span
                            className="text-sm text-muted-foreground leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(activity),
                            }}
                          ></span>
                          {onAddToTeaching && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onAddToTeaching("activity", {
                                  title: `Activity: ${section.title}`,
                                  content: activity,
                                  sectionId: section.id,
                                  activityIndex: index,
                                })
                              }
                              className="text-deep-sky-blue hover:text-deep-sky-blue-600 hover:bg-deep-sky-blue/10 flex-shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Assessment */}
              {section.assessment && (
                <div className="mt-4 p-4 bg-sea-green/5 rounded-xl border border-sea-green/20">
                  <div className="flex items-center text-sea-green mb-2">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    <h5 className="font-semibold">Assessment</h5>
                  </div>
                  <div
                    className="text-sm text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(section.assessment),
                    }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
