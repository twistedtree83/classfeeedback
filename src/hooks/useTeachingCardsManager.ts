import { useState } from "react";
import type { LessonCard, ProcessedLesson, CardAttachment } from "../lib/types";
import { DropResult } from "@hello-pangea/dnd";

export function useTeachingCardsManager(
  selectedCards: LessonCard[],
  lesson: ProcessedLesson,
  onSave: (cards: LessonCard[]) => void
) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentCardForAttachment, setCurrentCardForAttachment] = useState<
    string | null
  >(null);
  const [showDifferentiatedSelector, setShowDifferentiatedSelector] =
    useState(false);
  const [showActivityExpander, setShowActivityExpander] = useState(false);

  // Handle drag end event with error handling
  const handleDragEnd = (result: DropResult) => {
    try {
      // Dropped outside the list
      if (!result.destination) {
        return;
      }

      const reorderedCards = Array.from(selectedCards);
      const [removed] = reorderedCards.splice(result.source.index, 1);
      reorderedCards.splice(result.destination.index, 0, removed);

      onSave(reorderedCards);
    } catch (error) {
      console.error("Error handling drag end:", error);
    }
  };

  // Add a new custom card
  const handleAddCustomCard = () => {
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: "custom",
      title: "Custom Card",
      content: "Enter content here...",
      duration: null,
      sectionId: null,
      activityIndex: null,
      attachments: [],
    };

    onSave([...selectedCards, newCard]);

    // Start editing the new card
    setEditingCardId(newCard.id);
    setEditTitle(newCard.title);
    setEditContent(newCard.content);
    setEditDuration("");
  };

  // Remove a card
  const handleRemoveCard = (id: string) => {
    onSave(selectedCards.filter((card) => card.id !== id));

    // If we're editing this card, stop editing
    if (editingCardId === id) {
      setEditingCardId(null);
    }
  };

  // Start editing a card
  const handleEditCard = (card: LessonCard) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditContent(card.content);
    setEditDuration(card.duration || "");
  };

  // Save edited card
  const handleSaveEdit = (id: string) => {
    const updatedCards = selectedCards.map((card) => {
      if (card.id === id) {
        return {
          ...card,
          title: editTitle,
          content: editContent,
          duration: editDuration.trim() ? editDuration : null,
        };
      }
      return card;
    });

    onSave(updatedCards);
    setEditingCardId(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditTitle("");
    setEditContent("");
    setEditDuration("");
  };

  // Toggle card mode (student-friendly/original)
  const toggleCardMode = (cardId: string) => {
    const updatedCards = selectedCards.map((card) => {
      if (card.id === cardId) {
        const newStudentFriendly = !card.studentFriendly;
        return {
          ...card,
          studentFriendly: newStudentFriendly,
          content:
            newStudentFriendly && card.originalContent
              ? card.originalContent
              : card.content,
        };
      }
      return card;
    });
    onSave(updatedCards);
  };

  // Toggle differentiated view
  const toggleDifferentiated = (cardId: string) => {
    const updatedCards = selectedCards.map((card) => {
      if (card.id === cardId) {
        return {
          ...card,
          isDifferentiated: !card.isDifferentiated,
        };
      }
      return card;
    });
    onSave(updatedCards);
  };

  // Attachment management
  const handleAddAttachment = (cardId: string) => {
    setCurrentCardForAttachment(cardId);
    setShowUploadModal(true);
  };

  const handleAttachmentAdded = (attachment: CardAttachment) => {
    if (!currentCardForAttachment) return;

    const updatedCards = selectedCards.map((card) => {
      if (card.id === currentCardForAttachment) {
        return {
          ...card,
          attachments: [...(card.attachments || []), attachment],
        };
      }
      return card;
    });

    onSave(updatedCards);
    setShowUploadModal(false);
    setCurrentCardForAttachment(null);
  };

  const handleDeleteAttachment = (cardId: string, attachmentId: string) => {
    const updatedCards = selectedCards.map((card) => {
      if (card.id === cardId) {
        return {
          ...card,
          attachments: (card.attachments || []).filter(
            (att) => att.id !== attachmentId
          ),
        };
      }
      return card;
    });
    onSave(updatedCards);
  };

  // Handle saving expanded activities from ActivityBulkExpander
  const handleSaveExpandedActivities = (
    updates: { sectionIndex: number; activityIndex: number; expanded: string }[]
  ) => {
    if (!lesson || updates.length === 0) return;
    
    // First, update the sections in the lesson
    const updatedSections = [...lesson.sections];
    
    updates.forEach(({ sectionIndex, activityIndex, expanded }) => {
      if (
        sectionIndex >= 0 &&
        sectionIndex < updatedSections.length &&
        activityIndex >= 0 &&
        activityIndex < updatedSections[sectionIndex].activities.length
      ) {
        updatedSections[sectionIndex].activities[activityIndex] = expanded;
      }
    });
    
    // Next, update any related cards that already exist
    const updatedCards = selectedCards.map(card => {
      if (card.type === 'activity' && card.sectionId && card.activityIndex !== null) {
        // Find the corresponding section
        const sectionIndex = updatedSections.findIndex(s => s.id === card.sectionId);
        if (sectionIndex !== -1 && card.activityIndex < updatedSections[sectionIndex].activities.length) {
          // Update the card content with the expanded activity
          return {
            ...card,
            content: updatedSections[sectionIndex].activities[card.activityIndex]
          };
        }
      }
      return card;
    });
    
    // Save updated cards
    onSave(updatedCards);
    
    // Close the modal
    setShowActivityExpander(false);
  };

  return {
    // Editing state
    editingCardId,
    editTitle,
    editContent,
    editDuration,
    setEditTitle,
    setEditContent,
    setEditDuration,

    // Modal state
    showUploadModal,
    setShowUploadModal,
    currentCardForAttachment,
    setCurrentCardForAttachment,
    showDifferentiatedSelector,
    setShowDifferentiatedSelector,
    showActivityExpander,
    setShowActivityExpander,

    // Card management actions
    handleDragEnd,
    handleAddCustomCard,
    handleRemoveCard,
    handleEditCard,
    handleSaveEdit,
    handleCancelEdit,
    toggleCardMode,
    toggleDifferentiated,

    // Attachment actions
    handleAddAttachment,
    handleAttachmentAdded,
    handleDeleteAttachment,
    
    // Activity expansion
    handleSaveExpandedActivities,
  };
}