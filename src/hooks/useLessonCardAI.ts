import { useState } from "react";
import {
  makeContentStudentFriendly,
  generateSuccessCriteria,
  generateDifferentiatedContent,
  improveLearningIntentions,
} from "../lib/aiService";
import type { LessonCard } from "../lib/types";
import { supabase } from "../lib/supabase/client";

export function useLessonCardAI(
  selectedCards: LessonCard[],
  lesson: any,
  onSave: (updatedCards: LessonCard[]) => void
) {
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const [processingAllCards, setProcessingAllCards] = useState(false);
  const [generatingCriteria, setGeneratingCriteria] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] =
    useState(false);
  const [differentiatingCardId, setDifferentiatingCardId] = useState<
    string | null
  >(null);
  const [improvingIntentions, setImprovingIntentions] = useState(false);
  const [successCriteria, setSuccessCriteria] = useState<string[]>(
    lesson.success_criteria || []
  );
  const [criteriaMessage, setCriteriaMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [intentionsMessage, setIntentionsMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Function to save lesson to database
  const saveLessonToDatabase = async (updatedLesson: any) => {
    try {
      // Get the lesson ID from URL or lesson object
      const currentPath = window.location.pathname;
      const lessonIdMatch = currentPath.match(/\/planner\/([^\/]+)/);
      const lessonId = lessonIdMatch ? lessonIdMatch[1] : lesson.id;

      if (!lessonId) {
        console.error("No lesson ID found for saving");
        return false;
      }

      const { error } = await supabase
        .from("lesson_plans")
        .update({
          processed_content: updatedLesson,
        })
        .eq("id", lessonId);

      if (error) {
        console.error("Error saving lesson to database:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception saving lesson to database:", error);
      return false;
    }
  };

  // Make a single card student-friendly
  const makeCardStudentFriendly = async (cardId: string) => {
    if (processingCardId) return false;

    setProcessingCardId(cardId);

    try {
      const cardIndex = selectedCards.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return false;

      const card = selectedCards[cardIndex];

      // Save original content if not already saved
      const originalContent = card.originalContent || card.content;

      // Make content student-friendly
      const studentFriendlyContent = await makeContentStudentFriendly(
        originalContent,
        card.type,
        lesson.level
      );

      // Update the cards
      const updatedCards = [...selectedCards];
      updatedCards[cardIndex] = {
        ...card,
        content: studentFriendlyContent,
        originalContent: originalContent,
        studentFriendly: true,
      };

      onSave(updatedCards);
      return true;
    } catch (error) {
      console.error("Error making card student-friendly:", error);
      return false;
    } finally {
      setProcessingCardId(null);
    }
  };

  // Make all cards student-friendly
  const makeAllCardsStudentFriendly = async () => {
    if (processingAllCards || selectedCards.length === 0) return false;

    setProcessingAllCards(true);

    try {
      // Process each card sequentially to avoid rate limits
      let updatedCards = [...selectedCards];

      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i];

        // Skip cards that are already student-friendly
        if (card.studentFriendly) continue;

        // Save original content if not already saved
        const originalContent = card.originalContent || card.content;

        // Make content student-friendly
        const studentFriendlyContent = await makeContentStudentFriendly(
          originalContent,
          card.type,
          lesson.level
        );

        // Update the card
        updatedCards[i] = {
          ...card,
          content: studentFriendlyContent,
          originalContent: originalContent,
          studentFriendly: true,
        };
      }

      onSave(updatedCards);
      return true;
    } catch (error) {
      console.error("Error making cards student-friendly:", error);
      return false;
    } finally {
      setProcessingAllCards(false);
    }
  };

  // Generate success criteria from learning objectives
  const handleGenerateSuccessCriteria = async () => {
    if (generatingCriteria || lesson.objectives.length === 0) return false;

    setGeneratingCriteria(true);
    setCriteriaMessage(null);

    try {
      const criteria = await generateSuccessCriteria(
        lesson.objectives,
        lesson.level
      );

      if (criteria && criteria.length > 0) {
        setSuccessCriteria(criteria);
        // Also update the lesson object with the new success criteria
        lesson.success_criteria = criteria;

        // Save the updated lesson to the database
        const saveSuccess = await saveLessonToDatabase(lesson);
        if (!saveSuccess) {
          console.warn(
            "Failed to save success criteria to database, but they are available in this session"
          );
        }

        setCriteriaMessage({
          text: "Success criteria generated successfully",
          type: "success",
        });

        // Update any existing objective cards with the new success criteria
        const updatedCards = selectedCards.map((card) => {
          if (card.type === "objective") {
            const objectives = lesson.objectives
              .map((obj: string) => `• ${obj}`)
              .join("\n");
            const content = `${objectives}\n\n**Success Criteria:**\n${criteria
              .map((sc) => `• ${sc}`)
              .join("\n")}`;

            return {
              ...card,
              content,
              title: "Learning Intentions and Success Criteria",
            };
          }
          return card;
        });

        onSave(updatedCards);
        return true;
      } else {
        throw new Error("Failed to generate success criteria");
      }
    } catch (err) {
      console.error("Error generating success criteria:", err);
      setCriteriaMessage({
        text:
          err instanceof Error
            ? err.message
            : "Failed to generate success criteria",
        type: "error",
      });
      return false;
    } finally {
      setGeneratingCriteria(false);

      // Clear success message after 5 seconds
      if (criteriaMessage?.type === "success") {
        setTimeout(() => {
          setCriteriaMessage(null);
        }, 5000);
      }
    }
  };

  // Improve existing learning intentions to make them more focused
  const handleImproveLearningIntentions = async () => {
    if (improvingIntentions || lesson.objectives.length === 0) return false;

    setImprovingIntentions(true);
    setIntentionsMessage(null);

    try {
      const improvedObjectives = await improveLearningIntentions(
        lesson.objectives,
        lesson.level
      );

      if (improvedObjectives && improvedObjectives.length > 0) {
        // Update the lesson objectives directly
        lesson.objectives = improvedObjectives;

        // Save the updated lesson to the database
        const saveSuccess = await saveLessonToDatabase(lesson);
        if (!saveSuccess) {
          console.warn(
            "Failed to save improved learning intentions to database, but they are available in this session"
          );
        }

        setIntentionsMessage({
          text: "Learning intentions improved successfully",
          type: "success",
        });

        // Update any existing objective cards with the improved learning intentions
        const updatedCards = selectedCards.map((card) => {
          if (card.type === "objective") {
            const objectives = improvedObjectives
              .map((obj: string) => `• ${obj}`)
              .join("\n");
            const content =
              successCriteria.length > 0
                ? `${objectives}\n\n**Success Criteria:**\n${successCriteria
                    .map((sc) => `• ${sc}`)
                    .join("\n")}`
                : objectives;

            return {
              ...card,
              content,
              title: "Learning Intentions and Success Criteria",
            };
          }
          return card;
        });

        onSave(updatedCards);
        return true;
      } else {
        throw new Error("Failed to improve learning intentions");
      }
    } catch (err) {
      console.error("Error improving learning intentions:", err);
      setIntentionsMessage({
        text:
          err instanceof Error
            ? err.message
            : "Failed to improve learning intentions",
        type: "error",
      });
      return false;
    } finally {
      setImprovingIntentions(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setIntentionsMessage(null);
      }, 5000);
    }
  };

  // Create differentiated version of a single card
  const createDifferentiatedCard = async (cardId: string) => {
    if (differentiatingCardId) return false;

    setDifferentiatingCardId(cardId);

    try {
      const cardIndex = selectedCards.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return false;

      const card = selectedCards[cardIndex];

      // Use the student-friendly content as base if available, otherwise use original
      const contentToAdapt =
        card.studentFriendly && card.originalContent
          ? card.content
          : card.originalContent || card.content;

      // Generate differentiated content
      const differentiatedContent = await generateDifferentiatedContent(
        contentToAdapt,
        card.type,
        lesson.level
      );

      // Update the card
      const updatedCards = [...selectedCards];
      updatedCards[cardIndex] = {
        ...card,
        differentiatedContent,
      };

      onSave(updatedCards);
      return true;
    } catch (error) {
      console.error("Error creating differentiated card:", error);
      return false;
    } finally {
      setDifferentiatingCardId(null);
    }
  };

  // Create differentiated version of all cards
  const createDifferentiatedCards = async () => {
    if (generatingDifferentiated || selectedCards.length === 0) return false;

    setGeneratingDifferentiated(true);

    try {
      // Process each card sequentially to avoid rate limits
      let updatedCards = [...selectedCards];

      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i];

        // Skip cards that already have differentiated content
        if (card.differentiatedContent) continue;

        // Use the student-friendly content as base if available, otherwise use original
        const contentToAdapt =
          card.studentFriendly && card.originalContent
            ? card.content
            : card.originalContent || card.content;

        // Generate differentiated content
        const differentiatedContent = await generateDifferentiatedContent(
          contentToAdapt,
          card.type,
          lesson.level
        );

        // Update the card
        updatedCards[i] = {
          ...card,
          differentiatedContent,
        };
      }

      onSave(updatedCards);
      return true;
    } catch (error) {
      console.error("Error creating differentiated cards:", error);
      return false;
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  return {
    // State
    processingCardId,
    processingAllCards,
    generatingCriteria,
    generatingDifferentiated,
    differentiatingCardId,
    improvingIntentions,
    successCriteria,
    criteriaMessage,
    intentionsMessage,

    // Methods
    makeCardStudentFriendly,
    makeAllCardsStudentFriendly,
    handleGenerateSuccessCriteria,
    handleImproveLearningIntentions,
    createDifferentiatedCard,
    createDifferentiatedCards,
  };
}
