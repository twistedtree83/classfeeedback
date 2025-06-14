import React, { useState, useCallback } from "react";
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
  Maximize2,
  Minimize2,
  Layers,
  LayoutGrid,
  Columns,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/utils";
import type { LessonCard, ProcessedLesson, CardAttachment } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadModal } from "@/components/FileUploadModal";
import { DifferentiatedCardsSelector } from "@/components/DifferentiatedCardsSelector";
import { ActivityBulkExpander } from "@/components/ActivityBulkExpander";

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
  // State for card editing
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // State for modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentCardForAttachment, setCurrentCardForAttachment] = useState<string | null>(null);
  const [showDifferentiatedSelector, setShowDifferentiatedSelector] = useState(false);
  const [showActivityExpander, setShowActivityExpander] = useState(false);
  
  // AI processing state
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const [differentiatingCardId, setDifferentiatingCardId] = useState<string | null>(null);
  const [processingAllCards, setProcessingAllCards] = useState(false);
  
  // View options
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [cardSorterLayout, setCardSorterLayout] = useState<'grid' | 'list'>('grid');

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
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = selectedCards.findIndex((card) => card.id === active.id);
      const newIndex = selectedCards.findIndex((card) => card.id === over.id);

      const newCards = [...selectedCards];
      const [movedCard] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, movedCard);

      onSave(newCards);
    }
  }, [selectedCards, onSave]);

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
    openCardForEditing(newCard);
  };

  // Remove a card
  const handleRemoveCard = (id: string) => {
    onSave(selectedCards.filter((card) => card.id !== id));
    setActiveCardId(null);
    setShowCardDialog(false);
  };

  // Open card dialog for editing
  const openCardForEditing = (card: LessonCard) => {
    setActiveCardId(card.id);
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditContent(card.content);
    setEditDuration(card.duration || "");
    setShowCardDialog(true);
  };

  // Save edited card
  const handleSaveEdit = () => {
    if (!editingCardId) return;

    const updatedCards = selectedCards.map((card) => {
      if (card.id === editingCardId) {
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
  };

  // Toggle card expanded state in sorter view
  const toggleCardExpanded = (cardId: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Toggle all cards expanded/collapsed
  const toggleAllCards = () => {
    if (expandedCardIds.size === selectedCards.length) {
      // Collapse all
      setExpandedCardIds(new Set());
    } else {
      // Expand all
      setExpandedCardIds(new Set(selectedCards.map(card => card.id)));
    }
  };

  // Toggle card mode (student-friendly/original)
  const toggleCardMode = (cardId: string) => {
    const updatedCards = selectedCards.map((card) => {
      if (card.id === cardId) {
        const newStudentFriendly = !card.studentFriendly;
        return {
          ...card,
          studentFriendly: newStudentFriendly,
          content: newStudentFriendly && card.originalContent ? card.originalContent : card.content,
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

  // Make a card student-friendly
  const makeCardStudentFriendly = async (cardId: string) => {
    setProcessingCardId(cardId);
    // Simulate API call for now
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

  // Create differentiated content for a card
  const createDifferentiatedCard = async (cardId: string) => {
    setDifferentiatingCardId(cardId);
    // Simulate API call for now
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

  // Make all cards student-friendly
  const makeAllCardsStudentFriendly = async () => {
    setProcessingAllCards(true);
    // Simulate API call for now
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

  // Create differentiated versions for all cards
  const createDifferentiatedCards = async () => {
    setShowDifferentiatedSelector(true);
  };

  // Create objective card
  const createObjectiveCard = () => {
    const content = lesson.objectives.map((obj) => `• ${obj}`).join("\n");
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
  };

  // Create materials card
  const createMaterialsCard = () => {
    const content = lesson.materials.map((mat) => `• ${mat}`).join("\n");
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
  };

  // Create topic background card
  const createTopicBackgroundCard = () => {
    onSave([
      ...selectedCards,
      {
        id: crypto.randomUUID(),
        type: "topic_background",
        title: "Topic Background",
        content: lesson.topic_background || "Background information for this topic...",
        duration: null,
        sectionId: null,
        activityIndex: null,
        attachments: [],
      },
    ]);
  };

  // Create section cards
  const createSectionCards = () => {
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
    // Implementation for expanded activities saving
  };

  // Function to open a specific card in the dialog
  const openCardDialog = (cardId: string) => {
    const card = selectedCards.find(c => c.id === cardId);
    if (card) {
      setActiveCardId(cardId);
      setShowCardDialog(true);
    }
  };

  // Active card reference
  const activeCard = activeCardId 
    ? selectedCards.find(card => card.id === activeCardId) 
    : null;

  // Card sorter components
  const CardSorterItem = ({ card }: { card: LessonCard }) => {
    const isExpanded = expandedCardIds.has(card.id);
    
    const getCardTypeIcon = (type: string) => {
      switch (type) {
        case "objective":
          return <Target className="h-4 w-4 text-primary" />;
        case "material":
          return <BookOpen className="h-4 w-4 text-accent" />;
        case "section":
          return <BookMarked className="h-4 w-4 text-secondary" />;
        case "activity":
          return <Lightbulb className="h-4 w-4 text-warning" />;
        case "topic_background":
          return <Lightbulb className="h-4 w-4 text-info" />;
        default:
          return <FileEdit className="h-4 w-4 text-muted-foreground" />;
      }
    };
    
    const getCardTypeClass = (type: string) => {
      switch (type) {
        case "objective":
          return "border-primary/20 bg-primary/5";
        case "material":
          return "border-accent/20 bg-accent/5";
        case "section":
          return "border-secondary/20 bg-secondary/5";
        case "activity":
          return "border-warning/20 bg-warning/5";
        case "topic_background":
          return "border-info/20 bg-info/5";
        default:
          return "border-gray-200 bg-gray-50";
      }
    };
    
    // Card for grid view
    if (cardSorterLayout === 'grid') {
      return (
        <div 
          className={`rounded-lg border shadow-sm ${getCardTypeClass(card.type)} overflow-hidden 
                    transition-all duration-200 hover:shadow-md cursor-pointer h-full flex flex-col`}
          onClick={() => openCardDialog(card.id)}
        >
          <div className="p-3 border-b border-gray-200/50 flex justify-between items-center">
            <div className="flex items-center gap-2 truncate">
              {getCardTypeIcon(card.type)}
              <h3 className="font-medium text-sm truncate">{card.title}</h3>
            </div>
            <div className="flex items-center gap-1">
              {card.studentFriendly && (
                <Badge variant="outline" className="h-5 text-xs bg-success/20 text-success">SF</Badge>
              )}
              {card.differentiatedContent && (
                <Badge variant="outline" className="h-5 text-xs bg-info/20 text-info">Diff</Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardExpanded(card.id);
                }}
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="p-3 flex-1 overflow-y-auto max-h-36 text-xs">
              <div 
                className="prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(card.content.substring(0, 200) + (card.content.length > 200 ? '...' : '')) 
                }}
              />
            </div>
          )}
          
          {!isExpanded && (
            <div className="p-3 flex-1 overflow-hidden text-xs line-clamp-3 text-gray-500">
              {card.content.substring(0, 100) + (card.content.length > 100 ? '...' : '')}
            </div>
          )}
          
          {(card.attachments?.length > 0 || card.duration) && (
            <div className="px-3 py-2 border-t border-gray-200/50 flex items-center justify-between text-xs text-gray-500">
              {card.duration && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {card.duration}
                </span>
              )}
              {card.attachments?.length > 0 && (
                <span className="flex items-center">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {card.attachments.length}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // Card for list view
    return (
      <div 
        className={`rounded-lg border shadow-sm ${getCardTypeClass(card.type)} 
                  transition-all duration-200 hover:shadow-md cursor-pointer`}
        onClick={() => openCardDialog(card.id)}
      >
        <div className="p-3 flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getCardTypeIcon(card.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{card.title}</h3>
              <div className="flex items-center gap-1 ml-2">
                {card.studentFriendly && (
                  <Badge variant="outline" className="h-5 text-xs bg-success/20 text-success">SF</Badge>
                )}
                {card.differentiatedContent && (
                  <Badge variant="outline" className="h-5 text-xs bg-info/20 text-info">Diff</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardExpanded(card.id);
                  }}
                >
                  {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            {isExpanded ? (
              <div className="mt-2 text-xs">
                <div 
                  className="prose prose-xs max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(card.content.substring(0, 300) + (card.content.length > 300 ? '...' : '')) 
                  }}
                />
              </div>
            ) : (
              <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {card.content.substring(0, 100).replace(/<[^>]*>/g, '') + (card.content.length > 100 ? '...' : '')}
              </div>
            )}
            
            {(card.attachments?.length > 0 || card.duration) && (
              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                {card.duration && (
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {card.duration}
                  </span>
                )}
                {card.attachments?.length > 0 && (
                  <span className="flex items-center">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {card.attachments.length} {card.attachments.length === 1 ? 'attachment' : 'attachments'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // SortableCard component for Drag and Drop
  const SortableCard = ({ card, index }: { card: LessonCard; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: card.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="touch-manipulation"
      >
        <div className="relative group mb-3">
          <div 
            {...attributes}
            {...listeners}
            className="absolute top-0 left-0 w-6 h-6 flex items-center justify-center 
                       cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100
                       bg-white/80 rounded-tl-lg rounded-br-lg transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </div>
          <CardSorterItem card={card} />
        </div>
      </div>
    );
  };

  // Render the card editor dialog
  const CardEditorDialog = () => {
    if (!activeCard) return null;

    const displayContent = editingCardId === activeCard.id
      ? editContent
      : activeCard.isDifferentiated && activeCard.differentiatedContent
      ? activeCard.differentiatedContent
      : activeCard.studentFriendly && activeCard.originalContent
      ? activeCard.content
      : activeCard.content;

    return (
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {activeCard.type === "objective" && <Target className="h-5 w-5 text-blue-600" />}
              {activeCard.type === "material" && <BookOpen className="h-5 w-5 text-green-600" />}
              {activeCard.type === "section" && <BookMarked className="h-5 w-5 text-purple-600" />}
              {activeCard.type === "activity" && <Lightbulb className="h-5 w-5 text-orange-600" />}
              {activeCard.type === "topic_background" && <Lightbulb className="h-5 w-5 text-indigo-600" />}
              {activeCard.type === "custom" && <FileEdit className="h-5 w-5 text-gray-600" />}
              
              {editingCardId === activeCard.id ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-bold text-lg border-none bg-transparent p-0 h-7 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                  placeholder="Card title"
                />
              ) : (
                <span>{activeCard.title}</span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              {/* Edit/Save button */}
              {editingCardId === activeCard.id ? (
                <Button
                  onClick={handleSaveEdit}
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditingCardId(activeCard.id);
                    setEditTitle(activeCard.title);
                    setEditContent(activeCard.content);
                    setEditDuration(activeCard.duration || "");
                  }}
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              
              <Button
                onClick={() => handleRemoveCard(activeCard.id)}
                variant="destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="space-y-4">
                {/* Duration field */}
                {editingCardId === activeCard.id ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <Input
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      placeholder="e.g. 10 minutes"
                    />
                  </div>
                ) : activeCard.duration && (
                  <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-md text-sm mb-4">
                    <Clock className="h-4 w-4 mr-1 text-gray-600" />
                    {activeCard.duration}
                  </div>
                )}

                {/* Main content */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Content</h3>
                  {editingCardId === activeCard.id ? (
                    <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="Enter content with Markdown formatting..."
                    />
                  ) : (
                    <div className="p-4 bg-white border rounded-md">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
                      />
                    </div>
                  )}
                </div>

                {/* Additional content versions */}
                {!editingCardId && (
                  <div className="space-y-4 mt-6">
                    {/* Student-friendly version */}
                    {activeCard.originalContent && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold flex items-center">
                            <UserCircle className="h-4 w-4 mr-1 text-green-600" />
                            Student-Friendly Version
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCardMode(activeCard.id)}
                            className={`text-xs ${
                              activeCard.studentFriendly 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : "text-gray-600"
                            }`}
                          >
                            {activeCard.studentFriendly ? "Using Student-Friendly" : "Using Original"}
                          </Button>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: sanitizeHtml(
                                activeCard.studentFriendly
                                  ? activeCard.content
                                  : activeCard.originalContent
                              )
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Differentiated version */}
                    {activeCard.differentiatedContent && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold flex items-center">
                            <Split className="h-4 w-4 mr-1 text-blue-600" />
                            Differentiated Version
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDifferentiated(activeCard.id)}
                            className={`text-xs ${
                              activeCard.isDifferentiated
                                ? "bg-blue-100 text-blue-700 border-blue-200" 
                                : "text-gray-600"
                            }`}
                          >
                            {activeCard.isDifferentiated ? "Using Differentiated" : "Using Standard"}
                          </Button>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: sanitizeHtml(activeCard.differentiatedContent)
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {activeCard.attachments && activeCard.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attachments ({activeCard.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeCard.attachments.map((attachment) => (
                        <div key={attachment.id} className="p-3 border rounded-md bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            {attachment.type === 'image' && <BookOpen className="h-4 w-4 text-green-600" />}
                            {attachment.type === 'file' && <FileEdit className="h-4 w-4 text-blue-600" />}
                            {attachment.type === 'link' && <Paperclip className="h-4 w-4 text-purple-600" />}
                            <span className="truncate text-sm">{attachment.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteAttachment(activeCard.id, attachment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar with actions */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Card Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* AI Actions */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground">AI Enhancements</h3>
                    
                    {!activeCard.originalContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => makeCardStudentFriendly(activeCard.id)}
                        disabled={processingCardId === activeCard.id}
                      >
                        {processingCardId === activeCard.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserCircle className="h-4 w-4 mr-2" />
                        )}
                        Make Student-Friendly
                      </Button>
                    )}
                    
                    {!activeCard.differentiatedContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => createDifferentiatedCard(activeCard.id)}
                        disabled={differentiatingCardId === activeCard.id}
                      >
                        {differentiatingCardId === activeCard.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Split className="h-4 w-4 mr-2" />
                        )}
                        Create Differentiated Version
                      </Button>
                    )}
                  </div>

                  <Separator />
                  
                  {/* Resource Management */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground">Resources</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleAddAttachment(activeCard.id)}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add Attachment
                    </Button>
                  </div>

                  <Separator />
                  
                  {/* Cancel button when editing */}
                  {editingCardId === activeCard.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleCancelEdit}
                    >
                      Cancel Editing
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Prepare sections with activities for bulk expander
  const sectionsWithActivities = lesson.sections
    .map((section, index) => ({
      section: section.title,
      sectionIndex: index,
      activities: section.activities || [],
    }))
    .filter((section) => section.activities.length > 0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sorter">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="sorter" className="flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            <span>Card Sorter</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Create</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>AI Tools</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Card Sorter View */}
        <TabsContent value="sorter" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Card Sorter</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleAllCards}
              >
                {expandedCardIds.size === selectedCards.length ? (
                  <Minimize2 className="h-4 w-4 mr-1" />
                ) : (
                  <Maximize2 className="h-4 w-4 mr-1" />
                )}
                {expandedCardIds.size === selectedCards.length ? "Collapse All" : "Expand All"}
              </Button>
              
              <div className="flex rounded-md overflow-hidden">
                <Button
                  variant={cardSorterLayout === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCardSorterLayout('grid')}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={cardSorterLayout === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCardSorterLayout('list')}
                  className="rounded-l-none"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {selectedCards.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Cards Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first card to begin building your presentation.</p>
              <Button onClick={handleAddCustomCard}>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Card
              </Button>
            </div>
          ) : (
            <div className={`mt-4 ${cardSorterLayout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-3'}`}>
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
          )}
        </TabsContent>
        
        {/* Create Cards Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Add Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={createObjectiveCard}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-dark-purple/30 text-dark-purple hover:bg-dark-purple/10"
                >
                  <Target className="h-6 w-6 text-dark-purple" />
                  <span className="text-sm font-medium">Learning Objectives</span>
                </Button>

                <Button
                  onClick={createMaterialsCard}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
                >
                  <BookOpen className="h-6 w-6 text-harvest-gold" />
                  <span className="text-sm font-medium">Materials</span>
                </Button>

                <Button
                  onClick={createTopicBackgroundCard}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-bice-blue/30 text-bice-blue hover:bg-bice-blue/10"
                >
                  <Lightbulb className="h-6 w-6 text-bice-blue" />
                  <span className="text-sm font-medium">Topic Background</span>
                </Button>

                <Button
                  onClick={createSectionCards}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
                >
                  <BookMarked className="h-6 w-6 text-deep-sky-blue" />
                  <span className="text-sm font-medium">All Sections</span>
                </Button>

                <Button
                  onClick={handleAddCustomCard}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-muted-foreground/30 text-muted-foreground hover:bg-muted/10"
                >
                  <FileEdit className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Custom Card</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Tools Tab */}
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
                    disabled={false}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-success text-success hover:bg-success/10"
                  >
                    <ListChecks className="h-4 w-4" />
                    Generate Success Criteria
                  </Button>
                </div>

                {/* Learning Intentions Improvement */}
                <div className="space-y-2">
                  <Button
                    disabled={false}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-secondary text-secondary hover:bg-secondary/10"
                  >
                    <PencilRuler className="h-4 w-4" />
                    Improve Learning Intentions
                  </Button>
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
                  {processingAllCards ? "Processing..." : "Make All Student-Friendly"}
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
      </Tabs>

      {/* Card Editor Dialog */}
      {CardEditorDialog()}

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
      
      {showActivityExpander && (
        <ActivityBulkExpander
          activities={sectionsWithActivities}
          lessonTitle={lesson.title}
          lessonLevel={lesson.level}
          onClose={() => setShowActivityExpander(false)}
          onSaveExpanded={handleSaveExpandedActivities}
        />
      )}
    </div>
  );
}