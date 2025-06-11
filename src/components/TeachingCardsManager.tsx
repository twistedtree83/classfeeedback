import React from "react";
import { useTeachingCardsManager } from "../hooks/useTeachingCardsManager";
import { useLessonCardAI } from "../hooks/useLessonCardAI";
import { CardCreationToolbar } from "./cards/CardCreationToolbar";
import { CardsContainer } from "./cards/CardsContainer";
import { FileUploadModal } from "./FileUploadModal";
import { DifferentiatedCardsSelector } from "./DifferentiatedCardsSelector";
import {
  createObjectiveCard,
  createMaterialsCard,
  createTopicBackgroundCard,
  createSectionCard,
  createActivityCard,
} from "../lib/cardFactory";
import type { LessonCard, ProcessedLesson } from "../lib/types";

interface TeachingCardsManagerProps {
  lesson: ProcessedLesson;
  selectedCards: LessonCard[];
  onSave: (cards: LessonCard[]) => void;
}

export function TeachingCardsManager({
  lesson,
  selectedCards,
  onSave,
}: TeachingCardsManagerProps) {
  // Use our custom hooks for state management
  const cardManager = useTeachingCardsManager(selectedCards, lesson, onSave);

  // Use our custom AI hook with the direct onSave callback
  const aiTools = useLessonCardAI(selectedCards, lesson, onSave);

  // Create card functions using the factory
  const createObjectiveCardHandler = () => {
    const newCard = createObjectiveCard(lesson, aiTools.successCriteria);
    onSave([...selectedCards, newCard]);
  };

  const createMaterialsCardHandler = () => {
    const newCard = createMaterialsCard(lesson);
    onSave([...selectedCards, newCard]);
  };

  const createTopicBackgroundCardHandler = () => {
    const newCard = createTopicBackgroundCard(lesson);
    onSave([...selectedCards, newCard]);
  };

  const createSectionCardsHandler = () => {
    const newCards = lesson.sections.flatMap((section) => {
      const sectionCard = createSectionCard(section, lesson);
      const activityCards =
        section.activities?.map((activity, index) =>
          createActivityCard(activity, index, section.id, section.title)
        ) || [];
      return [sectionCard, ...activityCards];
    });
    onSave([...selectedCards, ...newCards]);
  };

  return (
    <div className="space-y-8">
      {/* Card Creation Toolbar */}
      <CardCreationToolbar
        lesson={lesson}
        successCriteria={aiTools.successCriteria}
        criteriaMessage={aiTools.criteriaMessage?.text || ""}
        intentionsMessage={aiTools.intentionsMessage?.text || ""}
        generatingCriteria={aiTools.generatingCriteria}
        improvingIntentions={aiTools.improvingIntentions}
        processingAllCards={aiTools.processingAllCards}
        onCreateObjectiveCard={createObjectiveCardHandler}
        onCreateMaterialsCard={createMaterialsCardHandler}
        onCreateTopicBackgroundCard={createTopicBackgroundCardHandler}
        onCreateSectionCards={createSectionCardsHandler}
        onAddCustomCard={cardManager.handleAddCustomCard}
        onGenerateSuccessCriteria={aiTools.handleGenerateSuccessCriteria}
        onImproveLearningIntentions={aiTools.handleImproveLearningIntentions}
        onMakeAllStudentFriendly={aiTools.makeAllCardsStudentFriendly}
        onCreateDifferentiatedCards={aiTools.createDifferentiatedCards}
        onToggleDifferentiatedSelector={() =>
          cardManager.setShowDifferentiatedSelector(
            !cardManager.showDifferentiatedSelector
          )
        }
      />

      {/* Cards Container */}
      <CardsContainer
        cards={selectedCards}
        editingCardId={cardManager.editingCardId}
        editTitle={cardManager.editTitle}
        editContent={cardManager.editContent}
        editDuration={cardManager.editDuration}
        processingCardId={aiTools.processingCardId}
        differentiatingCardId={aiTools.differentiatingCardId}
        onDragEnd={cardManager.handleDragEnd}
        onEdit={cardManager.handleEditCard}
        onSave={cardManager.handleSaveEdit}
        onCancel={cardManager.handleCancelEdit}
        onRemove={cardManager.handleRemoveCard}
        onToggleMode={cardManager.toggleCardMode}
        onToggleDifferentiated={cardManager.toggleDifferentiated}
        onMakeStudentFriendly={aiTools.makeCardStudentFriendly}
        onCreateDifferentiated={aiTools.createDifferentiatedCard}
        onAddAttachment={cardManager.handleAddAttachment}
        onDeleteAttachment={cardManager.handleDeleteAttachment}
        onTitleChange={cardManager.setEditTitle}
        onContentChange={cardManager.setEditContent}
        onDurationChange={cardManager.setEditDuration}
      />

      {/* Modals */}
      {cardManager.showUploadModal && (
        <FileUploadModal
          isOpen={cardManager.showUploadModal}
          onClose={() => cardManager.setShowUploadModal(false)}
          onAttachmentAdded={cardManager.handleAttachmentAdded}
        />
      )}

      {cardManager.showDifferentiatedSelector && (
        <DifferentiatedCardsSelector
          cards={selectedCards}
          lesson={lesson}
          onApply={(updatedCards) => {
            onSave(updatedCards);
            cardManager.setShowDifferentiatedSelector(false);
          }}
          onCancel={() => cardManager.setShowDifferentiatedSelector(false)}
        />
      )}
    </div>
  );
}
