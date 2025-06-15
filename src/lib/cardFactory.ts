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

// New function to create a card with a single learning intention
export function createSingleObjectiveCard(
  objective: string
): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "objective",
    title: "Learning Intention",
    content: `• ${objective}`,
    duration: null,
    sectionId: null,
    activityIndex: null,
    attachments: [],
  };
}

// New function to create a card with a single success criterion
export function createSingleSuccessCriterionCard(
  criterion: string
): LessonCard {
  return {
    id: crypto.randomUUID(),
    type: "objective",
    title: "Success Criterion",
    content: `• ${criterion}`,
    duration: null,
    sectionId: null,
    activityIndex: null,
    attachments: [],
  };
}

/**
 * Finds or creates a learning intentions card
 * @param cards Array of existing cards
 * @param objective New objective to add
 * @returns Updated array of cards with the objective added
 */
export function addToLearningIntentionsCard(
  cards: LessonCard[],
  objective: string
): LessonCard[] {
  // Find existing learning intentions card
  const intentionsCardIndex = cards.findIndex(
    card => card.type === "objective" && card.title === "Learning Intentions"
  );

  if (intentionsCardIndex >= 0) {
    // Add to existing card
    const updatedCards = [...cards];
    const card = updatedCards[intentionsCardIndex];
    
    // Check if this objective is already in the card
    if (!card.content.includes(objective)) {
      updatedCards[intentionsCardIndex] = {
        ...card,
        content: card.content + `\n• ${objective}`
      };
    }
    
    return updatedCards;
  } else {
    // Create a new card
    return [...cards, {
      id: crypto.randomUUID(),
      type: "objective",
      title: "Learning Intentions",
      content: `• ${objective}`,
      duration: null,
      sectionId: null,
      activityIndex: null,
      attachments: []
    }];
  }
}

/**
 * Finds or creates a success criteria card
 * @param cards Array of existing cards
 * @param criterion New criterion to add
 * @returns Updated array of cards with the criterion added
 */
export function addToSuccessCriteriaCard(
  cards: LessonCard[],
  criterion: string
): LessonCard[] {
  // Find existing success criteria card
  const criteriaCardIndex = cards.findIndex(
    card => card.type === "objective" && card.title === "Success Criteria"
  );

  if (criteriaCardIndex >= 0) {
    // Add to existing card
    const updatedCards = [...cards];
    const card = updatedCards[criteriaCardIndex];
    
    // Check if this criterion is already in the card
    if (!card.content.includes(criterion)) {
      updatedCards[criteriaCardIndex] = {
        ...card,
        content: card.content + `\n• ${criterion}`
      };
    }
    
    return updatedCards;
  } else {
    // Create a new card
    return [...cards, {
      id: crypto.randomUUID(),
      type: "objective",
      title: "Success Criteria",
      content: `• ${criterion}`,
      duration: null,
      sectionId: null,
      activityIndex: null,
      attachments: []
    }];
  }
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