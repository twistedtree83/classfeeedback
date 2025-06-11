import type { LessonCard, ProcessedLesson } from "./types";

export function createObjectiveCard(
  lesson: ProcessedLesson,
  successCriteria: string[] = []
): LessonCard {
  const objectives = lesson.objectives.map((obj) => `• ${obj}`).join("\n");

  // Add success criteria if available
  const content =
    successCriteria.length > 0
      ? `${objectives}\n\n**Success Criteria:**\n${successCriteria
          .map((sc) => `• ${sc}`)
          .join("\n")}`
      : objectives;

  return {
    id: crypto.randomUUID(),
    type: "objective",
    title: "Learning Intentions and Success Criteria",
    content: content,
    duration: null,
    sectionId: null,
    activityIndex: null,
    attachments: [],
  };
}

export function createMaterialsCard(lesson: ProcessedLesson): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "material",
    title: "Required Materials",
    content: lesson.materials
      .filter((m) => m.trim())
      .map((mat) => `• ${mat}`)
      .join("\n"),
    duration: null,
    sectionId: null,
    activityIndex: null,
    attachments: [],
  };
}

export function createTopicBackgroundCard(lesson: ProcessedLesson): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "topic_background",
    title: "Topic Background",
    content:
      lesson.topic_background || "Background information for this topic...",
    duration: null,
    sectionId: null,
    activityIndex: null,
    attachments: [],
  };
}

export function createSectionCard(
  section: any,
  lesson: ProcessedLesson
): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "section",
    title: section.title,
    content: section.content,
    duration: section.duration,
    sectionId: section.id,
    activityIndex: null,
    attachments: [],
  };
}

export function createActivityCard(
  activity: string,
  activityIndex: number,
  sectionId: string,
  sectionTitle: string
): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "activity",
    title: `${sectionTitle} - Activity ${activityIndex + 1}`,
    content: activity,
    duration: null,
    sectionId: sectionId,
    activityIndex: activityIndex,
    attachments: [],
  };
}

export function createCustomCard(): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "custom",
    title: "Custom Card",
    content: "Enter content here...",
    duration: null,
    sectionId: null,
    activityIndex: null,
    attachments: [],
  };
}
