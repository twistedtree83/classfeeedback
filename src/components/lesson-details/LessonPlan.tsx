import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  FileText,
  BookOpen,
  List,
  CheckSquare,
  Plus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeHtml } from "@/lib/utils";
import type { ProcessedLesson } from "@/lib/types";
import { ActivityExpandButton } from "../activity/ActivityExpandButton";
import { ActivityExpander } from "../ActivityExpander";

interface LessonPlanProps {
  lesson: ProcessedLesson;
  setLesson: React.Dispatch<React.SetStateAction<ProcessedLesson | null>>;
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

export function LessonPlan({
  lesson,
  setLesson,
  onAddToTeaching,
}: LessonPlanProps) {
  const [expandedSections, setExpandedSections] = useState({
    objectives: true, // Keep objectives expanded by default
    background: false,
    materials: false,
    sections: false,
  });

  const [expanderData, setExpanderData] = useState<{
    activity: string;
    sectionTitle: string;
  } | null>(null);

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
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold font-display">
            Lesson Content
          </CardTitle>
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
      </CardHeader>

      <CardContent className="space-y-6">
        <Accordion
          type="multiple"
          defaultValue={["objectives"]}
          className="w-full"
        >
          {/* Learning Intentions Accordion */}
          <AccordionItem value="objectives">
            <AccordionTrigger className="py-4 text-lg font-medium flex items-center text-foreground hover:text-primary">
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
                {lesson.success_criteria &&
                  lesson.success_criteria.length > 0 && (
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
              <AccordionTrigger className="py-4 text-lg font-medium flex items-center text-foreground hover:text-primary">
                <div className="flex items-center text-info">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Topic Background
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 py-2">
                  <div
                    className="p-4 bg-muted rounded-lg prose dark:prose-invert max-w-none"
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
            <AccordionTrigger className="py-4 text-lg font-medium flex items-center text-foreground hover:text-primary">
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
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(material),
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
                      onAddToTeaching("material", {
                        title: "Required Materials",
                        content: lesson.materials
                          .map((mat) => `• ${mat}`)
                          .join("\n"),
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
            <AccordionTrigger className="py-4 text-lg font-medium flex items-center text-foreground hover:text-primary">
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
                        className="prose dark:prose-invert max-w-none text-muted-foreground"
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
                          <ul className="space-y-2">
                            {section.activities
                              .filter((activity) => activity.trim())
                              .map((activity, index) => (
                                <li
                                  key={index}
                                  className="flex items-start justify-between gap-3 p-2 bg-background/60 rounded-lg"
                                >
                                  <span
                                    className="text-sm text-muted-foreground flex-1"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHtml(activity),
                                    }}
                                  ></span>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {onAddToTeaching && (
                                      <Button
                                        variant="default"
                                        size="icon"
                                        className="bg-bice-blue hover:bg-bice-blue/90 text-white shadow"
                                        onClick={() =>
                                          onAddToTeaching("activity", {
                                            title: `Activity: ${section.title}`,
                                            content: activity,
                                            sectionId: section.id,
                                            activityIndex: index,
                                          })
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <ActivityExpandButton
                                      onClick={() =>
                                        setExpanderData({
                                          activity,
                                          sectionTitle: section.title,
                                        })
                                      }
                                    />
                                  </div>
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

        {/* Activity Expander Modal */}
        {expanderData && (
          <ActivityExpander
            activity={expanderData.activity}
            context={expanderData.sectionTitle}
            level={lesson.level}
            onExpandedActivity={(expanded) => {
              setLesson((prev) => {
                if (!prev) return prev;
                const clone = structuredClone(prev);
                const secIdx = lesson.sections.findIndex(
                  (s) => s.title === expanderData.sectionTitle
                );
                if (secIdx >= 0) {
                  const actIdx = clone.sections[secIdx].activities.findIndex(
                    (a) => a === expanderData?.activity
                  );
                  if (actIdx >= 0)
                    clone.sections[secIdx].activities[actIdx] = expanded;
                }
                return clone;
              });

              if (onAddToTeaching) {
                onAddToTeaching("activity", {
                  title: `Activity: ${expanderData.sectionTitle}`,
                  content: expanded,
                });
              }
              setExpanderData(null);
            }}
            onClose={() => setExpanderData(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
