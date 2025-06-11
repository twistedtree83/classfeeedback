import React from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { TeachingCard } from "./TeachingCard";
import type { LessonCard } from "../../lib/types";

interface CardsContainerProps {
  cards: LessonCard[];
  editingCardId: string | null;
  editTitle: string;
  editContent: string;
  editDuration: string;
  processingCardId: string | null;
  differentiatingCardId: string | null;
  onDragEnd: (result: DropResult) => void;
  onEdit: (card: LessonCard) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onRemove: (id: string) => void;
  onToggleMode: (cardId: string) => void;
  onToggleDifferentiated: (cardId: string) => void;
  onMakeStudentFriendly: (cardId: string) => void;
  onCreateDifferentiated: (cardId: string) => void;
  onAddAttachment: (cardId: string) => void;
  onDeleteAttachment: (cardId: string, attachmentId: string) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onDurationChange: (duration: string) => void;
}

export function CardsContainer({
  cards,
  editingCardId,
  editTitle,
  editContent,
  editDuration,
  processingCardId,
  differentiatingCardId,
  onDragEnd,
  onEdit,
  onSave,
  onCancel,
  onRemove,
  onToggleMode,
  onToggleDifferentiated,
  onMakeStudentFriendly,
  onCreateDifferentiated,
  onAddAttachment,
  onDeleteAttachment,
  onTitleChange,
  onContentChange,
  onDurationChange,
}: CardsContainerProps) {
  if (cards.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No cards selected
        </h3>
        <p className="text-gray-500 mb-6">
          Choose cards from the lesson content above to build your teaching
          presentation.
        </p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="teaching-cards">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-0 ${
              snapshot.isDraggingOver
                ? "bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4"
                : ""
            } transition-all duration-200`}
          >
            {cards.map((card, index) => (
              <TeachingCard
                key={card.id}
                card={card}
                index={index}
                isEditing={editingCardId === card.id}
                editTitle={editTitle}
                editContent={editContent}
                editDuration={editDuration}
                processingCardId={processingCardId}
                differentiatingCardId={differentiatingCardId}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onRemove={onRemove}
                onToggleMode={onToggleMode}
                onToggleDifferentiated={onToggleDifferentiated}
                onMakeStudentFriendly={onMakeStudentFriendly}
                onCreateDifferentiated={onCreateDifferentiated}
                onAddAttachment={onAddAttachment}
                onDeleteAttachment={onDeleteAttachment}
                onTitleChange={onTitleChange}
                onContentChange={onContentChange}
                onDurationChange={onDurationChange}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
