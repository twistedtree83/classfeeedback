import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { LessonCard, ProcessedLesson } from '../lib/types';
import { 
  Plus, 
  X, 
  GripVertical, 
  Edit, 
  Save, 
  BookOpen, 
  Sparkles, 
  Target, 
  Loader2, 
  CheckSquare,
  Split
} from 'lucide-react';
import { 
  makeContentStudentFriendly, 
  generateSuccessCriteria,
  generateDifferentiatedContent
} from '../lib/aiService';

interface TeachingCardsManagerProps {
  lesson: ProcessedLesson;
  selectedCards: LessonCard[];
  onSave: (cards: LessonCard[]) => void;
}

export function TeachingCardsManager({ lesson, selectedCards, onSave }: TeachingCardsManagerProps) {
  const [cards, setCards] = useState<LessonCard[]>(selectedCards);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const [processingAllCards, setProcessingAllCards] = useState(false);
  const [successCriteria, setSuccessCriteria] = useState<string[]>(lesson.success_criteria || []);
  const [generatingCriteria, setGeneratingCriteria] = useState(false);
  const [generatingDifferentiated, setGeneratingDifferentiated] = useState(false);
  const [differentiatingCardId, setDifferentiatingCardId] = useState<string | null>(null);

  // Update local cards state when selectedCards changes from parent
  useEffect(() => {
    setCards(selectedCards);
  }, [selectedCards]);

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const reorderedCards = Array.from(cards);
    const [removed] = reorderedCards.splice(result.source.index, 1);
    reorderedCards.splice(result.destination.index, 0, removed);

    setCards(reorderedCards);
    onSave(reorderedCards);
  };

  // Add a new custom card
  const handleAddCustomCard = () => {
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: 'custom',
      title: 'Custom Card',
      content: 'Enter content here...',
      duration: null,
      sectionId: null,
      activityIndex: null
    };
    
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    onSave(updatedCards);
    
    // Start editing the new card
    setEditingCardId(newCard.id);
    setEditTitle(newCard.title);
    setEditContent(newCard.content);
    setEditDuration('');
  };

  // Remove a card
  const handleRemoveCard = (id: string) => {
    const updatedCards = cards.filter(card => card.id !== id);
    setCards(updatedCards);
    onSave(updatedCards);
    
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
    setEditDuration(card.duration || '');
  };

  // Save edited card
  const handleSaveEdit = (id: string) => {
    const updatedCards = cards.map(card => {
      if (card.id === id) {
        return {
          ...card,
          title: editTitle,
          content: editContent,
          duration: editDuration.trim() ? editDuration : null
        };
      }
      return card;
    });
    
    setCards(updatedCards);
    onSave(updatedCards);
    setEditingCardId(null);
  };

  // Create an objective card from lesson
  const createObjectiveCard = () => {
    const objectives = lesson.objectives.map(obj => `• ${obj}`).join('\n');
    
    // Add success criteria if available
    const content = successCriteria.length > 0 
      ? `${objectives}\n\n**Success Criteria:**\n${successCriteria.map(sc => `• ${sc}`).join('\n')}`
      : objectives;
    
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: 'objective',
      title: 'Learning Intentions and Success Criteria',
      content: content,
      duration: null,
      sectionId: null,
      activityIndex: null
    };
    
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    onSave(updatedCards);
  };

  // Create a materials card from lesson
  const createMaterialsCard = () => {
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: 'material',
      title: 'Required Materials',
      content: lesson.materials.map(mat => `• ${mat}`).join('\n'),
      duration: null,
      sectionId: null,
      activityIndex: null
    };
    
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    onSave(updatedCards);
  };

  // Create a topic background card from lesson
  const createTopicBackgroundCard = () => {
    if (!lesson.topic_background) return;
    
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: 'topic_background',
      title: 'Topic Background',
      content: lesson.topic_background,
      duration: null,
      sectionId: null,
      activityIndex: null
    };
    
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    onSave(updatedCards);
  };

  // Generate success criteria from learning objectives
  const handleGenerateSuccessCriteria = async () => {
    if (generatingCriteria || lesson.objectives.length === 0) return;
    
    setGeneratingCriteria(true);
    
    try {
      const criteria = await generateSuccessCriteria(lesson.objectives, lesson.level);
      setSuccessCriteria(criteria);
      
      // Update any existing objective cards with the new success criteria
      const updatedCards = cards.map(card => {
        if (card.type === 'objective') {
          const objectives = lesson.objectives.map(obj => `• ${obj}`).join('\n');
          const content = `${objectives}\n\n**Success Criteria:**\n${criteria.map(sc => `• ${sc}`).join('\n')}`;
          
          return {
            ...card,
            content,
            title: 'Learning Intentions and Success Criteria'
          };
        }
        return card;
      });
      
      setCards(updatedCards);
      onSave(updatedCards);
    } catch (error) {
      console.error('Error generating success criteria:', error);
    } finally {
      setGeneratingCriteria(false);
    }
  };

  // Make all cards student-friendly
  const makeAllCardsStudentFriendly = async () => {
    if (processingAllCards || cards.length === 0) return;
    
    setProcessingAllCards(true);
    
    try {
      // Process each card sequentially to avoid rate limits
      let updatedCards = [...cards];
      
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
          studentFriendly: true
        };
      }
      
      setCards(updatedCards);
      onSave(updatedCards);
    } catch (error) {
      console.error('Error making cards student-friendly:', error);
    } finally {
      setProcessingAllCards(false);
    }
  };

  // Make a single card student-friendly
  const makeCardStudentFriendly = async (cardId: string) => {
    if (processingCardId) return;
    
    setProcessingCardId(cardId);
    
    try {
      const cardIndex = cards.findIndex(card => card.id === cardId);
      if (cardIndex === -1) return;
      
      const card = cards[cardIndex];
      
      // Save original content if not already saved
      const originalContent = card.originalContent || card.content;
      
      // Make content student-friendly
      const studentFriendlyContent = await makeContentStudentFriendly(
        originalContent,
        card.type,
        lesson.level
      );
      
      // Update the card
      const updatedCards = [...cards];
      updatedCards[cardIndex] = {
        ...card,
        content: studentFriendlyContent,
        originalContent: originalContent,
        studentFriendly: true
      };
      
      setCards(updatedCards);
      onSave(updatedCards);
    } catch (error) {
      console.error('Error making card student-friendly:', error);
    } finally {
      setProcessingCardId(null);
    }
  };

  // Create differentiated version of all cards
  const createDifferentiatedCards = async () => {
    if (generatingDifferentiated || cards.length === 0) return;
    
    setGeneratingDifferentiated(true);
    
    try {
      // Process each card sequentially to avoid rate limits
      let updatedCards = [...cards];
      
      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i];
        
        // Skip cards that already have differentiated content
        if (card.differentiatedContent) continue;
        
        // Use the student-friendly content as base if available, otherwise use original
        const contentToAdapt = card.studentFriendly && card.originalContent 
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
          differentiatedContent
        };
      }
      
      setCards(updatedCards);
      onSave(updatedCards);
    } catch (error) {
      console.error('Error creating differentiated cards:', error);
    } finally {
      setGeneratingDifferentiated(false);
    }
  };

  // Create differentiated version of a single card
  const createDifferentiatedCard = async (cardId: string) => {
    if (differentiatingCardId) return;
    
    setDifferentiatingCardId(cardId);
    
    try {
      const cardIndex = cards.findIndex(card => card.id === cardId);
      if (cardIndex === -1) return;
      
      const card = cards[cardIndex];
      
      // Use the student-friendly content as base if available, otherwise use original
      const contentToAdapt = card.studentFriendly && card.originalContent 
        ? card.content 
        : card.originalContent || card.content;
      
      // Generate differentiated content
      const differentiatedContent = await generateDifferentiatedContent(
        contentToAdapt,
        card.type,
        lesson.level
      );
      
      // Update the card
      const updatedCards = [...cards];
      updatedCards[cardIndex] = {
        ...card,
        differentiatedContent
      };
      
      setCards(updatedCards);
      onSave(updatedCards);
    } catch (error) {
      console.error('Error creating differentiated card:', error);
    } finally {
      setDifferentiatingCardId(null);
    }
  };

  // Toggle a card between teacher and student versions
  const toggleCardMode = (cardId: string) => {
    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = cards[cardIndex];
    
    // Only toggle if we have both versions
    if (!card.studentFriendly || !card.originalContent) return;
    
    const updatedCards = [...cards];
    updatedCards[cardIndex] = {
      ...card,
      content: card.studentFriendly ? card.originalContent : card.content,
      studentFriendly: !card.studentFriendly,
      isDifferentiated: false // Reset differentiated state when toggling
    };
    
    setCards(updatedCards);
    onSave(updatedCards);
  };

  // Toggle a card between standard and differentiated versions
  const toggleDifferentiated = (cardId: string) => {
    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = cards[cardIndex];
    
    // Only toggle if differentiated content exists
    if (!card.differentiatedContent) return;
    
    // Keep track of which content we should revert to
    const regularContent = card.isDifferentiated 
      ? (card.studentFriendly ? card.content : card.originalContent || card.content)
      : card.content;
    
    const updatedCards = [...cards];
    updatedCards[cardIndex] = {
      ...card,
      content: card.isDifferentiated ? regularContent : card.differentiatedContent,
      isDifferentiated: !card.isDifferentiated
    };
    
    setCards(updatedCards);
    onSave(updatedCards);
  };

  // Render a card based on its state (normal or editing)
  const renderCard = (card: LessonCard, index: number) => {
    const isEditing = editingCardId === card.id;
    const isProcessing = processingCardId === card.id;
    const isDifferentiating = differentiatingCardId === card.id;
    
    return (
      <Draggable key={card.id} draggableId={card.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-4 border rounded-lg bg-white shadow-sm"
          >
            {/* Always render the header with drag handle */}
            <div className="flex items-center p-3 border-b">
              <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    label="Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                ) : (
                  <>
                    <h3 className="font-medium text-gray-900">{card.title}</h3>
                    {card.duration && (
                      <div className="text-sm text-gray-500">{card.duration}</div>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-1">
                {!isEditing && card.studentFriendly && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md mr-2">
                    Student-Friendly
                  </span>
                )}
                {!isEditing && card.isDifferentiated && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-md mr-2">
                    Differentiated
                  </span>
                )}
                {!isEditing && (
                  <>
                    <button
                      onClick={() => isProcessing ? null : makeCardStudentFriendly(card.id)}
                      className={`p-1 text-gray-500 hover:text-indigo-600 rounded-full ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Make student-friendly"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => isDifferentiating ? null : createDifferentiatedCard(card.id)}
                      className={`p-1 text-gray-500 hover:text-purple-600 rounded-full ${isDifferentiating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Create differentiated version"
                      disabled={isDifferentiating}
                    >
                      {isDifferentiating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Split className="h-4 w-4" />
                      )}
                    </button>
                    {card.studentFriendly && card.originalContent && (
                      <button
                        onClick={() => toggleCardMode(card.id)}
                        className="p-1 text-gray-500 hover:text-indigo-600 rounded-full"
                        title={card.studentFriendly ? "Show teacher version" : "Show student version"}
                      >
                        {card.studentFriendly ? (
                          <Target className="h-4 w-4" />
                        ) : (
                          <CheckSquare className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {card.differentiatedContent && (
                      <button
                        onClick={() => toggleDifferentiated(card.id)}
                        className="p-1 text-gray-500 hover:text-purple-600 rounded-full"
                        title={card.isDifferentiated ? "Show standard version" : "Show differentiated version"}
                      >
                        {card.isDifferentiated ? (
                          <Target className="h-4 w-4" />
                        ) : (
                          <Split className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </>
                )}
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCardId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(card.id)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditCard(card)}
                      className="p-1 text-gray-500 hover:text-indigo-600 rounded-full"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveCard(card.id)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Card content */}
            {isEditing ? (
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                </div>
                
                <div className="mb-4">
                  <Input
                    label="Duration (optional)"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g., 10 minutes"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {card.content.length > 150
                  ? `${card.content.substring(0, 150)}...`
                  : card.content}
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Teaching Cards</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSuccessCriteria}
            disabled={generatingCriteria}
            className="flex items-center gap-1"
          >
            {generatingCriteria ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4" />
            )}
            Generate Success Criteria
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={createObjectiveCard}
          >
            <Target className="h-4 w-4 mr-1" />
            Add Learning Intentions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={createMaterialsCard}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Materials
          </Button>
          {lesson.topic_background && (
            <Button
              variant="outline"
              size="sm"
              onClick={createTopicBackgroundCard}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Add Background
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCustomCard}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Custom Card
          </Button>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Card Sequence ({cards.length} cards)</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={makeAllCardsStudentFriendly}
              disabled={processingAllCards || cards.length === 0}
              className="flex items-center gap-1"
            >
              {processingAllCards ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Make Accessible for Students
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createDifferentiatedCards}
              disabled={generatingDifferentiated || cards.length === 0}
              className="flex items-center gap-1"
            >
              {generatingDifferentiated ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Split className="h-4 w-4" />
                  Generate Differentiated Cards
                </>
              )}
            </Button>
          </div>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="cards">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {cards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                    No cards added yet. Add cards from the lesson plan or create custom cards.
                  </div>
                ) : (
                  cards.map((card, index) => renderCard(card, index))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}