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
  ExternalLink
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
import { SectionImprover } from "@/components/lesson/SectionImprover";

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

interface ActivityExpansionProps {
  activity: string;
  sectionId: string;
  activityIndex: number;
  onAddToTeaching?: (
    cardType: "objective" | "material" | "section" | "activity" | "topic_background",
    data: any
  ) => void;
  sectionTitle: string;
}

function ActivityExpansion({ 
  activity, 
  sectionId, 
  activityIndex, 
  onAddToTeaching,
  sectionTitle
}: ActivityExpansionProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExpand = async () => {
    if (!expanded) {
      setIsGenerating(true);
      try {
        // In a real implementation, this would call an API to expand the activity
        // For now, we'll just simulate a delay and add more detail
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create a more detailed version of the activity
        const expandedVersion = `${activity}\n\n**Detailed Instructions:**\n\n1. Setup: ${getRandomSetupInstructions()}\n2. Procedure: ${getRandomProcedureInstructions()}\n3. Variations: ${getRandomVariations()}\n4. Assessment: ${getRandomAssessment()}`;
        
        setExpandedActivity(expandedVersion);
        setExpanded(true);
      } catch (error) {
        console.error("Error expanding activity:", error);
      } finally {
        setIsGenerating(false);
      }
    } else {
      setExpanded(false);
    }
  };

  const handleUseExpanded = () => {
    if (onAddToTeaching && expanded) {
      onAddToTeaching("activity", {
        title: `Activity: ${sectionTitle}`,
        content: expandedActivity,
        sectionId: sectionId,
        activityIndex: activityIndex,
      });
    }
  };

  // Helper functions to generate random detailed content
  const getRandomSetupInstructions = () => {
    const setups = [
      "Arrange students in pairs facing each other about 2 meters apart.",
      "Create a grid on the floor using tape or chalk, with 1-meter squares.",
      "Divide the class into groups of 4-5 students and assign each group to a station.",
      "Set up cones in a zigzag pattern with 3 meters between each cone.",
      "Place students in a circle with enough space to move freely."
    ];
    return setups[Math.floor(Math.random() * setups.length)];
  };

  const getRandomProcedureInstructions = () => {
    const procedures = [
      "Demonstrate the technique first, then have students practice in pairs while you provide feedback.",
      "Start with a slow pace to ensure proper form, then gradually increase speed as students become comfortable.",
      "Have students take turns leading the activity while others follow, switching roles every 2 minutes.",
      "Begin with individual practice, then progress to partner work, and finally to small group collaboration.",
      "Use a countdown timer and challenge students to improve their performance with each round."
    ];
    return procedures[Math.floor(Math.random() * procedures.length)];
  };

  const getRandomVariations = () => {
    const variations = [
      "For advanced students, add obstacles to navigate around. For those who need support, reduce the distance or complexity.",
      "Modify the activity by changing the pace, direction, or adding additional rules as students progress.",
      "Create competitive and non-competitive versions to accommodate different student preferences.",
      "Adjust the space constraints to make the activity more challenging or more accessible.",
      "Provide visual cues for students who benefit from visual learning approaches."
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  };

  const getRandomAssessment = () => {
    const assessments = [
      "Observe student technique and provide immediate feedback. Look for proper form and execution.",
      "Have students self-assess using a simple rubric focusing on key skills.",
      "Use peer feedback with specific criteria for students to watch for.",
      "Track improvement over multiple attempts using a simple checklist.",
      "Ask students to reflect on their performance and identify one strength and one area for improvement."
    ];
    return assessments[Math.floor(Math.random() * assessments.length)];
  };

  return (
    <div className="relative">
      <div className="flex items-start">
        <div 
          className="flex-1 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(expanded ? expandedActivity : activity) }}
        ></div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpand}
          className="ml-2 flex-shrink-0 text-secondary bg-secondary/10 border border-secondary/30 hover:bg-secondary/20"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent"></div>
          ) : expanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
          <span className="ml-1 text-xs font-medium">
            {isGenerating ? "Expanding..." : expanded ? "Collapse" : "Expand"}
          </span>
        </Button>
      </div>
      
      {expanded && (
        <div className="mt-2 text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseExpanded}
            className="text-xs border-success text-success hover:bg-success/10"
          >
            Use Expanded Activity
          </Button>
        </div>
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

  // Map section names to their values
  const sectionValues = {
    objectives: "objectives",
    background: "background",
    materials: "materials",
    sections: "sections",
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
                                  className="flex flex-col gap-2 p-3 bg-background/60 rounded-lg"
                                >
                                  <ActivityExpansion
                                    activity={activity}
                                    sectionId={section.id}
                                    activityIndex={index}
                                    onAddToTeaching={onAddToTeaching}
                                    sectionTitle={section.title}
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