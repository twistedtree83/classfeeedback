import React, { useState } from "react";
import { 
  Clock, 
  FileText, 
  Target, 
  CheckSquare, 
  Plus,
  GraduationCap, 
  BookOpen, 
  List,
  Maximize2,
  Minimize2,
  ChevronRight,
  Wand
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "../lib/utils";
import type { ProcessedLesson } from "../lib/types";
import { ActivityExpander } from "./ActivityExpander";

interface LessonPlanDisplayProps {
  lesson: ProcessedLesson;
  onAddToTeaching?: (
    cardType: "objective" | "material" | "section" | "activity" | "topic_background",
    data: any
  ) => void;
}

interface LessonStatsProps {
  lesson: ProcessedLesson;
}

// Activity expansion component
interface ActivityExpandProps {
  activity: string;
  sectionId: string;
  sectionTitle: string;
  activityIndex: number;
  onAddToTeaching?: (
    cardType: "objective" | "material" | "section" | "activity" | "topic_background",
    data: any
  ) => void;
}

function ActivityExpand({ 
  activity, 
  sectionId, 
  sectionTitle,
  activityIndex, 
  onAddToTeaching 
}: ActivityExpandProps) {
  const [showExpander, setShowExpander] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);

  const handleExpandActivity = () => {
    setShowExpander(true);
  };

  const handleExpandedActivity = (expanded: string) => {
    setExpandedContent(expanded);
    setShowExpander(false);
  };

  return (
    <div className="group">
      <div className="flex items-start justify-between gap-2 w-full">
        <div 
          className="flex-1 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(expandedContent || activity) }}
        ></div>
        
        <div className="flex gap-1">
          {/* Highly visible expand button with strong visual styling */}
          <Button
            onClick={handleExpandActivity}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 h-auto"
          >
            <Wand className="h-4 w-4 mr-1" />
            Expand Activity
          </Button>

          {onAddToTeaching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onAddToTeaching("activity", {
                  title: `Activity: ${sectionTitle}`,
                  content: expandedContent || activity,
                  sectionId: sectionId,
                  activityIndex: activityIndex,
                })
              }
              className="text-secondary flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showExpander && (
        <ActivityExpander
          activity={activity}
          context={sectionTitle}
          onExpandedActivity={handleExpandedActivity}
          onClose={() => setShowExpander(false)}
        />
      )}
    </div>
  );
}

function LessonStatistics({ lesson }: LessonStatsProps) {
  const totalActivities = lesson.sections.reduce(
    (total, section) => total + section.activities.length,
    0
  );

  const stats = [
    {
      label: "Learning Objectives",
      value: lesson.objectives.filter((obj) => obj.trim()).length,
      icon: <Target className="h-5 w-5 text-primary" />,
      bgClass: "bg-primary/10",
    },
    {
      label: "Materials",
      value: lesson.materials.filter((mat) => mat.trim()).length,
      icon: <FileText className="h-5 w-5 text-accent" />,
      bgClass: "bg-accent/10",
    },
    {
      label: "Lesson Sections",
      value: lesson.sections.length,
      icon: <List className="h-5 w-5 text-secondary" />,
      bgClass: "bg-secondary/10",
    },
    {
      label: "Total Activities",
      value: totalActivities,
      icon: <CheckSquare className="h-5 w-5 text-success" />,
      bgClass: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.bgClass} rounded-xl p-3 flex flex-col items-center justify-center text-center`}
        >
          <div className="mb-2">
            {stat.icon}
          </div>
          <div className="text-2xl font-bold">
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LessonPlanDisplay({ lesson, onAddToTeaching }: LessonPlanDisplayProps) {
  const [expandedSections, setExpandedSections] = useState({
    objectives: true, // Keep objectives expanded by default
    background: false,
    materials: false,
    sections: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const allExpanded = Object.values(expandedSections).every(Boolean);

  const toggleAllSections = () => {
    const newState = !allExpanded;
    setExpandedSections({
      objectives: newState,
      background: newState,
      materials: newState,
      sections: newState,
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{lesson.title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllSections}
            className="ml-auto"
          >
            {allExpanded ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Expand All
              </>
            )}
          </Button>
        </div>

        <div 
          className="text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.summary) }}
        />

        <div className="flex flex-wrap gap-3 mt-2">
          <div className="inline-flex items-center rounded-md bg-secondary/10 px-3 py-1 text-sm">
            <Clock className="h-4 w-4 mr-2 text-secondary" />
            <span>{lesson.duration}</span>
          </div>

          {lesson.level && (
            <div className="inline-flex items-center rounded-md bg-accent/10 px-3 py-1 text-sm">
              <GraduationCap className="h-4 w-4 mr-2 text-accent" />
              <span>Level: {lesson.level}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lesson Statistics */}
        <LessonStatistics lesson={lesson} />
        
        {/* Accordions for Lesson Content */}
        <Accordion type="multiple" defaultValue={["objectives"]} className="w-full">
          {/* Learning Intentions Accordion */}
          <AccordionItem value="objectives">
            <AccordionTrigger className="py-4 text-lg font-medium flex items-center">
              <div className="flex items-center text-primary">
                <Target className="h-5 w-5 mr-2" />
                Learning Intentions
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 py-2">
                <ul className="space-y-3">
                  {lesson.objectives
                    .filter((obj) => obj.trim())
                    .map((objective, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span
                          className="text-foreground"
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
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Teaching
                  </Button>
                )}

                {/* Success Criteria */}
                {lesson.success_criteria && lesson.success_criteria.length > 0 && (
                  <div className="mt-6 p-4 bg-success/5 rounded-lg border border-success/20">
                    <h4 className="font-semibold text-success flex items-center mb-3">
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
                            <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                            <span
                              className="text-foreground text-sm"
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
                        className="mt-3"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Teaching
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Topic Background Accordion */}
          {lesson.topic_background && (
            <AccordionItem value="background">
              <AccordionTrigger className="py-4 text-lg font-medium flex items-center">
                <div className="flex items-center text-info">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Topic Background
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 py-2">
                  <div
                    className="p-4 bg-muted rounded-lg prose max-w-none"
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
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Teaching
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Materials Accordion */}
          <AccordionItem value="materials">
            <AccordionTrigger className="py-4 text-lg font-medium flex items-center">
              <div className="flex items-center text-accent">
                <FileText className="h-5 w-5 mr-2" />
                Materials Needed
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 py-2">
                <ul className="space-y-2">
                  {lesson.materials
                    .filter((material) => material.trim())
                    .map((material, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                      >
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                        <span
                          className="text-foreground"
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Teaching
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Lesson Sections Accordion */}
          <AccordionItem value="sections">
            <AccordionTrigger className="py-4 text-lg font-medium flex items-center">
              <div className="flex items-center text-secondary">
                <List className="h-5 w-5 mr-2" />
                Lesson Sections
                <Badge variant="outline" className="ml-2">
                  {lesson.sections.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 py-2">
                {lesson.sections.map((section, sectionIndex) => (
                  <Card key={section.id} className="shadow-sm overflow-hidden">
                    <CardHeader className="p-4 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium text-foreground">
                          {section.title}
                        </CardTitle>
                        <Badge variant="outline">{section.duration}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div
                        className="prose max-w-none text-muted-foreground"
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
                          className="mb-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section to Teaching
                        </Button>
                      )}

                      {/* Activities */}
                      {section.activities.length > 0 && (
                        <div className="mt-4 p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                          <h5 className="font-semibold text-foreground mb-3 flex items-center">
                            <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                            Activities ({section.activities.length})
                          </h5>
                          <ul className="space-y-4">
                            {section.activities
                              .filter((activity) => activity.trim())
                              .map((activity, index) => (
                                <li
                                  key={index}
                                  className="p-3 bg-background/60 rounded-lg border border-border/40"
                                >
                                  <ActivityExpand
                                    activity={activity}
                                    sectionId={section.id}
                                    sectionTitle={section.title}
                                    activityIndex={index}
                                    onAddToTeaching={onAddToTeaching}
                                  />
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Assessment */}
                      {section.assessment && (
                        <div className="mt-4 p-4 bg-success/5 rounded-xl border border-success/20">
                          <div className="flex items-center text-success mb-2">
                            <CheckSquare className="h-4 w-4 mr-2" />
                            <h5 className="font-semibold">Assessment</h5>
                          </div>
                          <div
                            className="text-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(section.assessment),
                            }}
                          ></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}