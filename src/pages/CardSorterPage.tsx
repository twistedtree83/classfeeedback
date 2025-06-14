import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  LayoutGrid,
  Layers,
  Maximize2,
  Minimize2,
  Edit,
  Save,
  X,
  Plus,
  Clock,
  Paperclip,
  UserCircle,
  Split,
  Wand2,
  Lightbulb,
  FileEdit,
  Target,
  BookOpen,
  BookMarked,
  Loader2,
  Users,
  GripVertical,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileUploadModal } from "@/components/FileUploadModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AttachmentDisplay } from "@/components/AttachmentDisplay";

import type { LessonCard, ProcessedLesson, CardAttachment } from "@/lib/types";
import { getLessonPlanById } from "@/lib/supabase";
import { sanitizeHtml } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { generateExtensionActivity } from "@/lib/ai/extensionActivity";

export function CardSorterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Main state
  const [lessonTitle, setLessonTitle] = useState("Loading...");
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);
  const [lesson, setLesson] = useState<ProcessedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Card dialog
  const [activeCard, setActiveCard] = useState<LessonCard | null>(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editExtensionActivity, setEditExtensionActivity] = useState("");
  const [editingExtensionActivity, setEditingExtensionActivity] = useState(false);
  const [generatingExtension, setGeneratingExtension] = useState(false);
  
  // Card modifications
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const [differentiatingCardId, setDifferentiatingCardId] = useState<string | null>(null);
  
  // Layout options
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // Attachment modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  
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
  
  // Load lesson data
  useEffect(() => {
    const loadLessonAndCards = async () => {
      if (!id) {
        navigate('/planner');
        return;
      }
      
      try {
        setLoading(true);
        const lessonData = await getLessonPlanById(id);
        
        if (!lessonData?.processed_content) {
          throw new Error("Lesson data not found");
        }
        
        setLesson(lessonData.processed_content);
        setLessonTitle(lessonData.processed_content.title);
        
        // Load saved cards from sessionStorage
        const savedCards = sessionStorage.getItem(`lesson_cards_${id}`);
        if (savedCards) {
          try {
            setSelectedCards(JSON.parse(savedCards));
          } catch (e) {
            console.error("Error parsing saved cards:", e);
          }
        }
      } catch (err) {
        console.error("Error loading lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
        toast({
          title: "Error",
          description: "Failed to load lesson data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadLessonAndCards();
  }, [id, navigate, toast]);
  
  // Save cards to sessionStorage when they change
  useEffect(() => {
    if (id && selectedCards.length > 0) {
      sessionStorage.setItem(`lesson_cards_${id}`, JSON.stringify(selectedCards));
    }
  }, [id, selectedCards]);
  
  // Filter cards based on search and filter criteria
  const filteredCards = selectedCards.filter(card => {
    const matchesSearch = searchTerm === "" || 
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filterType === null || card.type === filterType;
    
    return matchesSearch && matchesFilter;
  });
  
  // Handle drag end event
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = selectedCards.findIndex((card) => card.id === active.id);
      const newIndex = selectedCards.findIndex((card) => card.id === over.id);

      const newCards = [...selectedCards];
      const [movedCard] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, movedCard);

      setSelectedCards(newCards);
    }
  }, [selectedCards]);
  
  // Toggle card expanded/collapsed
  const toggleCardExpanded = (cardId: string) => {
    setExpandedCards(prev => {
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
    if (expandedCards.size === selectedCards.length) {
      // Collapse all
      setExpandedCards(new Set());
    } else {
      // Expand all
      setExpandedCards(new Set(selectedCards.map(card => card.id)));
    }
  };
  
  // Open card dialog
  const openCardDialog = (card: LessonCard) => {
    setActiveCard(card);
    setEditTitle(card.title);
    setEditContent(card.content);
    setEditDuration(card.duration || "");
    setEditExtensionActivity(card.extensionActivity || "");
    setEditMode(false);
    setEditingExtensionActivity(false);
    setShowCardDialog(true);
  };
  
  // Close card dialog
  const closeCardDialog = () => {
    setShowCardDialog(false);
    setActiveCard(null);
    setEditMode(false);
    setEditingExtensionActivity(false);
  };
  
  // Toggle edit mode in dialog
  const toggleEditMode = () => {
    if (editMode && activeCard) {
      // Save changes
      const updatedCards = selectedCards.map((card) => {
        if (card.id === activeCard.id) {
          return {
            ...card,
            title: editTitle,
            content: editContent,
            duration: editDuration || null,
          };
        }
        return card;
      });
      setSelectedCards(updatedCards);
      setEditMode(false);
    } else {
      // Enter edit mode
      setEditMode(true);
      setEditingExtensionActivity(false);
    }
  };
  
  // Toggle extension activity edit mode
  const toggleExtensionEditMode = () => {
    if (editingExtensionActivity && activeCard) {
      // Save changes
      const updatedCards = selectedCards.map((card) => {
        if (card.id === activeCard.id) {
          return {
            ...card,
            extensionActivity: editExtensionActivity,
          };
        }
        return card;
      });
      setSelectedCards(updatedCards);
      setEditingExtensionActivity(false);
    } else {
      // Enter edit mode
      setEditingExtensionActivity(true);
      setEditMode(false);
    }
  };
  
  // Generate extension activity
  const handleGenerateExtension = async () => {
    if (!activeCard) return;
    
    setGeneratingExtension(true);
    
    try {
      const extensionContent = await generateExtensionActivity(
        activeCard.content,
        lesson?.title,
        lesson?.level
      );
      
      setEditExtensionActivity(extensionContent);
      
      // Update the card
      const updatedCards = selectedCards.map((card) => {
        if (card.id === activeCard.id) {
          return {
            ...card,
            extensionActivity: extensionContent,
          };
        }
        return card;
      });
      
      setSelectedCards(updatedCards);
      setActiveCard({
        ...activeCard,
        extensionActivity: extensionContent,
      });
      
      toast({
        title: "Extension Activity Generated",
        description: "Fast finisher activity has been added to this card",
      });
      
    } catch (error) {
      console.error("Error generating extension:", error);
      toast({
        title: "Error",
        description: "Failed to generate extension activity",
        variant: "destructive",
      });
    } finally {
      setGeneratingExtension(false);
    }
  };
  
  // Toggle student-friendly mode for a card
  const toggleStudentFriendly = (cardId: string) => {
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
    setSelectedCards(updatedCards);
  };
  
  // Toggle differentiated content for a card
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
    setSelectedCards(updatedCards);
  };
  
  // Make card student-friendly using AI
  const makeCardStudentFriendly = (cardId: string) => {
    setProcessingCardId(cardId);
    // Simulated AI processing
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
      setSelectedCards(updatedCards);
      setProcessingCardId(null);
      
      // Update active card if in dialog
      if (activeCard && activeCard.id === cardId) {
        setActiveCard(updatedCards.find(c => c.id === cardId) || null);
      }
      
      toast({
        title: "Success",
        description: "Student-friendly version created",
      });
    }, 1500);
  };
  
  // Create differentiated content for a card
  const createDifferentiatedContent = (cardId: string) => {
    setDifferentiatingCardId(cardId);
    // Simulated AI processing
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
      setSelectedCards(updatedCards);
      setDifferentiatingCardId(null);
      
      // Update active card if in dialog
      if (activeCard && activeCard.id === cardId) {
        setActiveCard(updatedCards.find(c => c.id === cardId) || null);
      }
      
      toast({
        title: "Success",
        description: "Differentiated content created",
      });
    }, 1500);
  };
  
  // Delete a card
  const deleteCard = (cardId: string) => {
    if (!window.confirm("Are you sure you want to delete this card?")) {
      return;
    }
    
    setSelectedCards(prev => prev.filter(card => card.id !== cardId));
    if (activeCard?.id === cardId) {
      closeCardDialog();
    }
    
    toast({
      title: "Card Deleted",
      description: "The card has been removed from your presentation"
    });
  };
  
  // Add a new attachment to a card
  const handleAddAttachment = () => {
    if (!activeCard) return;
    setShowAttachmentModal(true);
  };
  
  // Handle when an attachment is added
  const handleAttachmentAdded = (attachment: CardAttachment) => {
    if (!activeCard) return;
    
    const updatedCards = selectedCards.map((card) => {
      if (card.id === activeCard.id) {
        return {
          ...card,
          attachments: [...(card.attachments || []), attachment],
        };
      }
      return card;
    });
    
    setSelectedCards(updatedCards);
    
    // Update active card
    const updatedCard = updatedCards.find(c => c.id === activeCard.id);
    if (updatedCard) {
      setActiveCard(updatedCard);
    }
    
    setShowAttachmentModal(false);
  };
  
  // Delete an attachment from a card
  const handleDeleteAttachment = (attachmentId: string) => {
    if (!activeCard) return;
    
    const updatedCards = selectedCards.map((card) => {
      if (card.id === activeCard.id) {
        return {
          ...card,
          attachments: (card.attachments || []).filter(a => a.id !== attachmentId),
        };
      }
      return card;
    });
    
    setSelectedCards(updatedCards);
    
    // Update active card
    const updatedCard = updatedCards.find(c => c.id === activeCard.id);
    if (updatedCard) {
      setActiveCard(updatedCard);
    }
  };
  
  // SortableCard component (used for drag and drop)
  const SortableCard = ({ card, index }: { card: LessonCard, index: number }) => {
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
      opacity: isDragging ? 0.6 : 1,
      width: '100%',
      height: '100%',
    };

    const isExpanded = expandedCards.has(card.id);
    
    // Get appropriate icon for card type
    const getCardIcon = (type: string) => {
      switch (type) {
        case "objective":
          return <Target className="h-5 w-5 text-blue-600" />;
        case "material":
          return <BookOpen className="h-5 w-5 text-green-600" />;
        case "section":
          return <BookMarked className="h-5 w-5 text-purple-600" />;
        case "activity":
          return <Lightbulb className="h-5 w-5 text-orange-600" />;
        case "topic_background":
          return <Lightbulb className="h-5 w-5 text-indigo-600" />;
        default:
          return <FileEdit className="h-5 w-5 text-gray-600" />;
      }
    };
    
    // Get background color class based on card type
    const getCardBackground = (type: string) => {
      switch (type) {
        case "objective":
          return "bg-blue-50 hover:bg-blue-100 border-blue-200";
        case "material":
          return "bg-green-50 hover:bg-green-100 border-green-200";
        case "section":
          return "bg-purple-50 hover:bg-purple-100 border-purple-200";
        case "activity":
          return "bg-orange-50 hover:bg-orange-100 border-orange-200";
        case "topic_background":
          return "bg-indigo-50 hover:bg-indigo-100 border-indigo-200";
        default:
          return "bg-gray-50 hover:bg-gray-100 border-gray-200";
      }
    };
    
    // Indicates if card has extension activity
    const hasExtension = card.extensionActivity && card.extensionActivity.length > 0;
    
    // Grid view card
    if (layout === 'grid') {
      return (
        <div
          ref={setNodeRef}
          style={style}
          className={`h-full transition-shadow duration-200 group ${
            isDragging ? "z-10" : ""
          }`}
        >
          <div className={`border rounded-lg shadow-sm overflow-hidden transition-all h-full flex flex-col
                          ${getCardBackground(card.type)}`}>
            {/* Card header with drag handle and number */}
            <div className="flex items-center p-3 border-b border-gray-200 gap-2">
              {/* Card number */}
              <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                {index + 1}
              </div>
              
              {/* Drag handle */}
              <div
                {...attributes}
                {...listeners}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mr-1"
              >
                <GripVertical className="h-5 w-5" />
              </div>
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getCardIcon(card.type)}
                <h3 className="font-medium text-gray-800 truncate text-sm" title={card.title}>
                  {card.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                {card.duration && (
                  <Badge variant="outline" className="h-5 text-xs">
                    {card.duration}
                  </Badge>
                )}
                {card.studentFriendly && (
                  <Badge variant="outline" className="h-5 text-xs bg-green-100 text-green-700 border-green-200">
                    SF
                  </Badge>
                )}
                {card.differentiatedContent && (
                  <Badge variant="outline" className="h-5 text-xs bg-blue-100 text-blue-700 border-blue-200">
                    Diff
                  </Badge>
                )}
                {hasExtension && (
                  <Badge variant="outline" className="h-5 text-xs bg-purple-100 text-purple-700 border-purple-200">
                    Ext
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardExpanded(card.id);
                  }}
                  className="h-7 w-7 rounded-full flex-shrink-0"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Card content preview */}
            <div 
              className={`transition-all overflow-hidden cursor-pointer flex-grow ${
                isExpanded ? "max-h-48 overflow-y-auto" : "max-h-24"
              }`}
              onClick={() => openCardDialog(card)}
            >
              <div className="p-3 text-sm text-gray-600 h-full">
                <div
                  className={`prose prose-xs max-w-none overflow-hidden ${
                    !isExpanded && "line-clamp-3"
                  }`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(card.content) }}
                />
              </div>
            </div>
            
            {/* Card footer */}
            {(card.attachments?.length || isExpanded || hasExtension) && (
              <div className="border-t border-gray-200 p-3 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {card.attachments?.length > 0 && (
                    <span className="flex items-center">
                      <Paperclip className="h-3 w-3 mr-1" />
                      {card.attachments.length}
                    </span>
                  )}
                  {hasExtension && (
                    <span className="flex items-center text-purple-600">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Fast Finisher
                    </span>
                  )}
                </div>
                <div className="ml-auto">
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => openCardDialog(card)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // List view card
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`mb-2 transition-shadow duration-200 group ${
          isDragging ? "z-10" : ""
        }`}
      >
        <div className={`border rounded-lg shadow-sm overflow-hidden transition-all
                        ${getCardBackground(card.type)}`}>
          <div className="flex items-center p-3">
            {/* Card number */}
            <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 mr-1">
              {index + 1}
            </div>
            
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mr-2"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getCardIcon(card.type)}
              <h3 className="font-medium text-gray-800 truncate" title={card.title}>
                {card.title}
              </h3>
            </div>
            
            <div className="flex items-center ml-auto gap-2 flex-shrink-0">
              {card.duration && (
                <Badge variant="outline" className="h-5 text-xs">
                  {card.duration}
                </Badge>
              )}
              {card.studentFriendly && (
                <Badge variant="outline" className="h-5 text-xs bg-green-100 text-green-700 border-green-200">
                  Student-Friendly
                </Badge>
              )}
              {card.differentiatedContent && (
                <Badge variant="outline" className="h-5 text-xs bg-blue-100 text-blue-700 border-blue-200">
                  Differentiated
                </Badge>
              )}
              {hasExtension && (
                <Badge variant="outline" className="h-5 text-xs bg-purple-100 text-purple-700 border-purple-200">
                  Fast Finisher
                </Badge>
              )}
              {card.attachments?.length > 0 && (
                <div className="flex items-center text-xs text-gray-500">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {card.attachments.length}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openCardDialog(card)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardExpanded(card.id);
                }}
                className="h-7 w-7 rounded-full"
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4 text-gray-500" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="px-3 pb-3 text-sm text-gray-600">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(card.content.substring(0, 200) + (card.content.length > 200 ? '...' : '')) }}
              />
              
              {hasExtension && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center text-xs text-purple-700 mb-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span className="font-semibold">Fast Finisher Activity:</span>
                  </div>
                  <div className="text-xs text-gray-600 italic">
                    {card.extensionActivity?.substring(0, 100)}
                    {(card.extensionActivity?.length || 0) > 100 ? '...' : ''}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Card Editor Dialog
  const renderCardDialog = () => {
    if (!activeCard) return null;
    
    // Determine the content to display
    const displayContent = activeCard.isDifferentiated && activeCard.differentiatedContent
      ? activeCard.differentiatedContent
      : activeCard.studentFriendly && activeCard.originalContent
      ? activeCard.content
      : activeCard.content;
    
    return (
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {activeCard.type === "objective" && <Target className="h-5 w-5 text-blue-600" />}
              {activeCard.type === "material" && <BookOpen className="h-5 w-5 text-green-600" />}
              {activeCard.type === "section" && <BookMarked className="h-5 w-5 text-purple-600" />}
              {activeCard.type === "activity" && <Lightbulb className="h-5 w-5 text-orange-600" />}
              {activeCard.type === "topic_background" && <Lightbulb className="h-5 w-5 text-indigo-600" />}
              {activeCard.type === "custom" && <FileEdit className="h-5 w-5 text-gray-600" />}
              
              {editMode ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold ml-2 border-none p-0 h-auto focus-visible:ring-0"
                  placeholder="Card Title"
                />
              ) : (
                <span className="ml-2">{activeCard.title}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Duration */}
              {editMode ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <Input
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 10 minutes"
                  />
                </div>
              ) : activeCard.duration && (
                <div className="flex items-center mb-4">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{activeCard.duration}</span>
                </div>
              )}
              
              {/* Main content area */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Content</h3>
                {editMode ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Enter card content with Markdown formatting..."
                  />
                ) : (
                  <div className="p-4 border rounded-lg bg-white">
                    <div 
                      className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-800"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
                    />
                  </div>
                )}
              </div>
              
              {/* Extension Activity Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
                    Fast Finisher Activity
                  </h3>
                  <div className="flex gap-2">
                    {activeCard.extensionActivity ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleExtensionEditMode}
                        className="text-xs"
                      >
                        {editingExtensionActivity ? "Save" : "Edit"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateExtension}
                        disabled={generatingExtension}
                        className="text-xs"
                      >
                        {generatingExtension ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {editingExtensionActivity ? (
                  <Textarea
                    value={editExtensionActivity}
                    onChange={(e) => setEditExtensionActivity(e.target.value)}
                    className="min-h-[150px] text-sm"
                    placeholder="Enter extension activity for fast finishers..."
                  />
                ) : activeCard.extensionActivity ? (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeHtml(activeCard.extensionActivity)
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-500">
                      No extension activity has been added yet. Generate one for fast finishers.
                    </p>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  Extension activities will only be shown to students who request additional work.
                </div>
              </div>
              
              {/* Student-friendly version */}
              {!editMode && !editingExtensionActivity && activeCard.originalContent && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center">
                      <UserCircle className="h-4 w-4 mr-1 text-green-600" />
                      Student-Friendly Version
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStudentFriendly(activeCard.id)}
                      className={`text-xs ${
                        activeCard.studentFriendly 
                          ? "bg-green-100 text-green-700 border-green-200" 
                          : "text-gray-600"
                      }`}
                    >
                      {activeCard.studentFriendly ? "Using Student-Friendly" : "Using Original"}
                    </Button>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
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
              {!editMode && !editingExtensionActivity && activeCard.differentiatedContent && (
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
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeHtml(activeCard.differentiatedContent)
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Attachments */}
              {!editMode && !editingExtensionActivity && activeCard.attachments && activeCard.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Attachments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCard.attachments.map(attachment => (
                      <div key={attachment.id} className="relative group">
                        <AttachmentDisplay 
                          attachment={attachment} 
                          isEditing={true}
                          onDelete={() => handleDeleteAttachment(attachment.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Card Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Edit/Save */}
                  {!editingExtensionActivity && (
                    <Button 
                      className="w-full justify-start" 
                      onClick={toggleEditMode}
                      variant="outline"
                    >
                      {editMode ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Card
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Extension Activity */}
                  {!editMode && (
                    <div>
                      {activeCard.extensionActivity ? (
                        <Button 
                          className="w-full justify-start" 
                          onClick={toggleExtensionEditMode}
                          variant="outline"
                        >
                          {editingExtensionActivity ? (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Extension
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Extension
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleGenerateExtension}
                          disabled={generatingExtension}
                        >
                          {generatingExtension ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Extension
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* AI Actions */}
                  {!editMode && !editingExtensionActivity && (
                    <div className="space-y-2 pt-2">
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
                          onClick={() => createDifferentiatedContent(activeCard.id)}
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
                  )}
                  
                  {/* Resource Management */}
                  {!editMode && !editingExtensionActivity && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-medium text-muted-foreground">Resources</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleAddAttachment}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Attachment
                      </Button>
                    </div>
                  )}
                  
                  <Separator className="my-2" />
                  
                  {/* Cancel Editing */}
                  {(editMode || editingExtensionActivity) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setEditMode(false);
                        setEditingExtensionActivity(false);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  
                  {/* Danger Zone */}
                  {!editMode && !editingExtensionActivity && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        closeCardDialog();
                        deleteCard(activeCard.id);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete Card
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={closeCardDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Add a new card
  const addNewCard = () => {
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: "custom",
      title: "New Card",
      content: "Enter content here...",
      duration: null,
      sectionId: null,
      activityIndex: null,
      attachments: [],
    };
    
    setSelectedCards(prev => [...prev, newCard]);
    openCardDialog(newCard);
  };
  
  // Return to lesson details
  const returnToLessonDetails = () => {
    navigate(`/planner/${id}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Button 
            onClick={() => navigate('/planner')}
            className="mt-4"
          >
            Return to Planner
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={returnToLessonDetails} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Lesson</span>
              </Button>
              
              <h1 className="text-xl font-bold truncate">{lessonTitle}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[240px]"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterType(null)}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("objective")}>
                    Learning Objectives
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("material")}>
                    Materials
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("section")}>
                    Sections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("activity")}>
                    Activities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("topic_background")}>
                    Topic Background
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("custom")}>
                    Custom Cards
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={layout === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLayout('grid')}
                  className="rounded-r-none px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={layout === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLayout('list')}
                  className="rounded-l-none px-3"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">
              {filterType ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Cards` : "All Cards"}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredCards.length} of {selectedCards.length})
              </span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleAllCards}
            >
              {expandedCards.size === selectedCards.length ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Expand All
                </>
              )}
            </Button>
            
            <Button 
              onClick={addNewCard}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>
        
        {filteredCards.length === 0 ? (
          <div className="bg-white border border-dashed rounded-lg p-12 text-center">
            {searchTerm || filterType ? (
              <>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No matching cards</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filter</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType(null);
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No cards yet</h3>
                <p className="text-gray-500 mb-4">Start adding cards to build your presentation</p>
                <Button onClick={addNewCard}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Card
                </Button>
              </>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className={
              layout === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr"
                : "space-y-2"
            }>
              <SortableContext
                items={filteredCards.map((card) => card.id)}
                strategy={rectSortingStrategy}
              >
                {filteredCards.map((card, index) => (
                  <SortableCard key={card.id} card={card} index={index} />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}
      </main>
      
      {/* Card editor dialog */}
      {renderCardDialog()}
      
      {/* Modals */}
      {showAttachmentModal && activeCard && (
        <FileUploadModal
          isOpen={showAttachmentModal}
          onClose={() => setShowAttachmentModal(false)}
          onAttachmentAdded={handleAttachmentAdded}
        />
      )}
    </div>
  );
}