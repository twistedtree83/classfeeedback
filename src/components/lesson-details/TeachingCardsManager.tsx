import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "./EmptyState";
import { FileUploadModal } from "@/components/FileUploadModal";
import { DifferentiatedCardsSelector } from "@/components/DifferentiatedCardsSelector";
import {
  Target,
  BookOpen,
  Lightbulb,
  BookMarked,
  FileEdit,
  PencilRuler,
  Wand2,
  ListChecks,
  Users,
  Loader2,
  Palette,
  Sparkles,
  Settings,
  ClipboardList,
  GripVertical,
  X,
  Edit,
  Save,
  UserCircle,
  Split,
  Paperclip,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/utils";
import type { LessonCard, ProcessedLesson, CardAttachment } from "@/lib/types";

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
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const [differentiatingCardId, setDifferentiatingCardId] = useState<
    string | null
  >(null);
  const [processingAllCards, setProcessingAllCards] = useState(false);
  const [generatingCriteria, setGeneratingCriteria] = useState(false);
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

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = selectedCards.findIndex((card) => card.id === active.id);
      const newIndex = selectedCards.findIndex((card) => card.id === over.id);

      const newCards = [...selectedCards];
      const [movedCard] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, movedCard);

      onSave(newCards);
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

  // Placeholder AI functions
  const makeCardStudentFriendly = async (cardId: string) => {
    setProcessingCardId(cardId);
    // Simulate API call
    setTimeout(() => {
      const updatedCards = selectedCards.map((card) => {
        if (card.id === cardId) {
          return {
            ...card,
            originalContent: card.content,
            content: `Student-friendly version of: ${card.content}`,
            studentFriendly: true,
          };
        }
        return card;
      });
      onSave(updatedCards);
      setProcessingCardId(null);
    }, 1500);
  };

  const createDifferentiatedCard = async (cardId: string) => {
    setDifferentiatingCardId(cardId);
    // Simulate API call
    setTimeout(() => {
      const updatedCards = selectedCards.map((card) => {
        if (card.id === cardId) {
          return {
            ...card,
            differentiatedContent: `Differentiated version of: ${card.content}`,
          };
        }
        return card;
      });
      onSave(updatedCards);
      setDifferentiatingCardId(null);
    }, 1500);
  };

  const makeAllCardsStudentFriendly = async () => {
    setProcessingAllCards(true);
    // Simulate API call
    setTimeout(() => {
      const updatedCards = selectedCards.map((card) => {
        if (!card.studentFriendly) {
          return {
            ...card,
            originalContent: card.content,
            content: `Student-friendly version of: ${card.content}`,
            studentFriendly: true,
          };
        }
        return card;
      });
      onSave(updatedCards);
      setProcessingAllCards(false);
    }, 2000);
  };

  const handleGenerateSuccessCriteria = async () => {
    setGeneratingCriteria(true);
    // Simulate API call
    setTimeout(() => {
      const criteria = [
        "I can demonstrate proper dribbling technique",
        "I can pass the ball accurately to a teammate",
        "I can maintain control of the ball while moving",
      ];
      setSuccessCriteria(criteria);
      setCriteriaMessage({
        text: "Success criteria generated successfully",
        type: "success",
      });
      setGeneratingCriteria(false);
    }, 2000);
  };

  const handleImproveLearningIntentions = async () => {
    setImprovingIntentions(true);
    // Simulate API call
    setTimeout(() => {
      setIntentionsMessage({
        text: "Learning intentions improved successfully",
        type: "success",
      });
      setImprovingIntentions(false);
    }, 2000);
  };

  const createDifferentiatedCards = async () => {
    setShowDifferentiatedSelector(true);
  };

  // Sortable card component
  function SortableCard({ card, index }: { card: LessonCard; index: number }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: card.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
    };

    const isEditing = editingCardId === card.id;

    const getCardIcon = (type: string) => {
      switch (type) {
        case "objective":
          return "🎯";
        case "material":
          return "📚";
        case "section":
          return "📖";
        case "activity":
          return "🎲";
        case "topic_background":
          return "🧠";
        default:
          return "📄";
      }
    };

    const getCardVariant = (type: string) => {
      switch (type) {
        case "objective":
          return "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900";
        case "material":
          return "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900";
        case "section":
          return "border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-900";
        case "activity":
          return "border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900";
        case "topic_background":
          return "border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-900";
        default:
          return "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800";
      }
    };

    const displayContent =
      card.isDifferentiated && card.differentiatedContent
        ? card.differentiatedContent
        : card.studentFriendly && card.originalContent
        ? card.content
        : card.content;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`mb-4 rounded-xl shadow-sm ${
          isDragging ? "shadow-lg rotate-2" : ""
        } transition-all duration-200 overflow-hidden touch-manipulation`}
      >
        <Card className={`${getCardVariant(card.type)}`}>
          <CardHeader className="p-3 flex flex-row items-start space-y-0 gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder card"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Card Header Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCardIcon(card.type)}</span>
                  {isEditing ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="font-semibold text-base border-none bg-transparent p-0 h-7 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                      placeholder="Card title"
                    />
                  ) : (
                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 truncate">
                      {card.title}
                    </h3>
                  )}
                  {card.duration && !isEditing && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white dark:bg-gray-800"
                    >
                      {card.duration}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Student-friendly toggle */}
                  {card.originalContent && (
                    <Button
                      onClick={() => toggleCardMode(card.id)}
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-auto rounded-full ${
                        card.studentFriendly
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                      title={
                        card.studentFriendly
                          ? "Show original"
                          : "Show student-friendly"
                      }
                    >
                      <UserCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Differentiated toggle */}
                  {card.differentiatedContent && (
                    <Button
                      onClick={() => toggleDifferentiated(card.id)}
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-auto rounded-full ${
                        card.isDifferentiated
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                      title={
                        card.isDifferentiated
                          ? "Show original"
                          : "Show differentiated"
                      }
                    >
                      <Split className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Make student-friendly */}
                  {!card.originalContent && (
                    <Button
                      onClick={() => makeCardStudentFriendly(card.id)}
                      disabled={processingCardId === card.id}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto rounded-full text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                      title="Make student-friendly"
                    >
                      {processingCardId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCircle className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Create differentiated */}
                  {!card.differentiatedContent && (
                    <Button
                      onClick={() => createDifferentiatedCard(card.id)}
                      disabled={differentiatingCardId === card.id}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto rounded-full text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Create differentiated version"
                    >
                      {differentiatingCardId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Attachment button */}
                  <Button
                    onClick={() => handleAddAttachment(card.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto rounded-full text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                    title="Add attachment"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  {/* Edit/Save button */}
                  {isEditing ? (
                    <Button
                      onClick={() => handleSaveEdit(card.id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto rounded-full text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      title="Save changes"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEditCard(card)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto rounded-full text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Edit card"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Remove button */}
                  <Button
                    onClick={() => handleRemoveCard(card.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto rounded-full text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title="Remove card"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Duration Input (when editing) */}
              {isEditing && (
                <div className="mt-2">
                  <input
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="Duration (optional)"
                    className="w-full text-sm h-8 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <hr className="border-t border-gray-200 dark:border-gray-700" />

          <CardContent className="p-3">
            {/* Card Content */}
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-200"
                placeholder="Card content..."
              />
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(displayContent),
                }}
              />
            )}

            {/* Content Type Indicators */}
            {(card.studentFriendly && card.originalContent) ||
            (card.isDifferentiated && card.differentiatedContent) ? (
              <div className="flex items-center gap-2 mt-3">
                {card.studentFriendly && card.originalContent && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                  >
                    Student-Friendly
                  </Badge>
                )}
                {card.isDifferentiated && card.differentiatedContent && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                  >
                    Differentiated
                  </Badge>
                )}
              </div>
            ) : null}

            {/* Attachments */}
            {card.attachments && card.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments
                </h4>
                <div className="space-y-2">
                  {card.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        {attachment.type === "image" && (
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-green-700 dark:text-green-300">
                            📷
                          </div>
                        )}
                        {attachment.type === "file" && (
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-300">
                            📄
                          </div>
                        )}
                        {attachment.type === "link" && (
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-300">
                            🔗
                          </div>
                        )}
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {attachment.name}
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          handleDeleteAttachment(card.id, attachment.id)
                        }
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel button when editing */}
            {isEditing && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-display">Teaching Cards</CardTitle>
        <CardDescription>
          {selectedCards.length > 0
            ? `${selectedCards.length} cards ready for presentation`
            : "Add cards from the lesson to create your presentation"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {selectedCards.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No cards yet"
            description="Add learning intentions, success criteria and activities from the left panel."
          />
        ) : (
          <Tabs defaultValue="cards">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger
                value="cards"
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <Palette className="h-4 w-4" />
                <span>Cards</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Tools</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <Settings className="h-4 w-4" />
                <span>Options</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    const content = lesson.objectives
                      .map((obj) => `• ${obj}`)
                      .join("\n");
                    onSave([
                      ...selectedCards,
                      {
                        id: crypto.randomUUID(),
                        type: "objective",
                        title: "Learning Intentions",
                        content,
                        duration: null,
                        sectionId: null,
                        activityIndex: null,
                        attachments: [],
                      },
                    ]);
                  }}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-dark-purple/30 text-dark-purple hover:bg-dark-purple/10"
                >
                  <Target className="h-6 w-6 text-dark-purple" />
                  <span className="text-xs font-medium leading-tight text-center">
                    Learning Objectives
                  </span>
                </Button>

                <Button
                  onClick={() => {
                    const content = lesson.materials
                      .map((mat) => `• ${mat}`)
                      .join("\n");
                    onSave([
                      ...selectedCards,
                      {
                        id: crypto.randomUUID(),
                        type: "material",
                        title: "Required Materials",
                        content,
                        duration: null,
                        sectionId: null,
                        activityIndex: null,
                        attachments: [],
                      },
                    ]);
                  }}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
                >
                  <BookOpen className="h-6 w-6 text-harvest-gold" />
                  <span className="text-xs font-medium leading-tight text-center">
                    Materials
                  </span>
                </Button>

                <Button
                  onClick={() => {
                    onSave([
                      ...selectedCards,
                      {
                        id: crypto.randomUUID(),
                        type: "topic_background",
                        title: "Topic Background",
                        content:
                          lesson.topic_background ||
                          "Background information for this topic...",
                        duration: null,
                        sectionId: null,
                        activityIndex: null,
                        attachments: [],
                      },
                    ]);
                  }}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-bice-blue/30 text-bice-blue hover:bg-bice-blue/10"
                >
                  <Lightbulb className="h-6 w-6 text-bice-blue" />
                  <span className="text-xs font-medium leading-tight text-center">
                    Topic Background
                  </span>
                </Button>

                <Button
                  onClick={() => {
                    const newCards = lesson.sections.flatMap((section) => {
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
                    });
                    onSave([...selectedCards, ...newCards]);
                  }}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
                >
                  <BookMarked className="h-6 w-6 text-deep-sky-blue" />
                  <span className="text-xs font-medium leading-tight text-center">
                    All Sections
                  </span>
                </Button>

                <Button
                  onClick={handleAddCustomCard}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-muted-foreground/30 text-muted-foreground hover:bg-muted/10"
                >
                  <FileEdit className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs font-medium leading-tight text-center">
                    Custom Card
                  </span>
                </Button>
              </div>

              <div className="max-h-[calc(100vh-25rem)] overflow-y-auto pr-2 mt-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={selectedCards.map((card) => card.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedCards.map((card, index) => (
                      <SortableCard key={card.id} card={card} index={index} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-accent" />
                    AI Enhancement Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Success Criteria Generation */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleGenerateSuccessCriteria}
                        disabled={generatingCriteria}
                        variant="outline"
                        className="w-full flex items-center gap-2 border-success text-success hover:bg-success/10"
                      >
                        {generatingCriteria ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ListChecks className="h-4 w-4" />
                        )}
                        {generatingCriteria
                          ? "Generating..."
                          : "Generate Success Criteria"}
                      </Button>

                      {criteriaMessage && (
                        <p className="text-sm text-muted-foreground bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 dark:border-gray-700/30 shadow-soft">
                          {criteriaMessage.text}
                        </p>
                      )}
                    </div>

                    {/* Learning Intentions Improvement */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleImproveLearningIntentions}
                        disabled={improvingIntentions}
                        variant="outline"
                        className="w-full flex items-center gap-2 border-secondary text-secondary hover:bg-secondary/10"
                      >
                        {improvingIntentions ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PencilRuler className="h-4 w-4" />
                        )}
                        {improvingIntentions
                          ? "Improving..."
                          : "Improve Learning Intentions"}
                      </Button>

                      {intentionsMessage && (
                        <p className="text-sm text-muted-foreground bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 dark:border-gray-700/30 shadow-soft">
                          {intentionsMessage.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bulk AI Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-muted">
                    <Button
                      onClick={makeAllCardsStudentFriendly}
                      disabled={processingAllCards}
                      variant="outline"
                      className="flex items-center gap-2 border-accent/30 text-accent hover:bg-accent/10"
                    >
                      {processingAllCards ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {processingAllCards
                        ? "Processing..."
                        : "Make All Student-Friendly"}
                    </Button>

                    <Button
                      onClick={createDifferentiatedCards}
                      variant="outline"
                      className="flex items-center gap-2 border-info/30 text-info hover:bg-info/10"
                    >
                      <Users className="h-4 w-4" />
                      Create Differentiated Cards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Presentation Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() =>
                      setShowDifferentiatedSelector(!showDifferentiatedSelector)
                    }
                    variant="outline"
                    className="flex items-center gap-2 w-full"
                  >
                    <Users className="h-4 w-4" />
                    Select Cards for Differentiation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      {/* Modals */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onAttachmentAdded={handleAttachmentAdded}
        />
      )}

      {showDifferentiatedSelector && (
        <DifferentiatedCardsSelector
          cards={selectedCards}
          lesson={lesson}
          onApply={(updatedCards) => {
            onSave(updatedCards);
            setShowDifferentiatedSelector(false);
          }}
          onCancel={() => setShowDifferentiatedSelector(false)}
        />
      )}
    </Card>
  );
}
