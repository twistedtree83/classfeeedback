import React, { useState } from 'react';
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
  Split,
  UserCircle,
  GraduationCap,
  PencilRuler,
  Lightbulb,
  BookMarked,
  Wand2,
  FileEdit,
  ListChecks
} from 'lucide-react';
import { sanitizeHtml } from '../lib/utils';
import { useLessonCardAI } from '../hooks/useLessonCardAI';

interface TeachingCardsManagerProps {
  lesson: ProcessedLesson;
  selectedCards: LessonCard[];
  onSave: (cards: LessonCard[]) => void;
}

export function TeachingCardsManager({ lesson, selectedCards, onSave }: TeachingCardsManagerProps) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDuration, setEditDuration] = useState('');

  // Use our custom AI hook with the direct onSave callback
  const {
    processingCardId,
    processingAllCards,
    generatingCriteria,
    generatingDifferentiated, 
    differentiatingCardId,
    successCriteria,
    criteriaMessage,
    makeCardStudentFriendly,
    makeAllCardsStudentFriendly,
    handleGenerateSuccessCriteria,
    createDifferentiatedCard,
    createDifferentiatedCards,
  } = useLessonCardAI(selectedCards, lesson, onSave);

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const reorderedCards = Array.from(selectedCards);
    const [removed] = reorderedCards.splice(result.source.index, 1);
    reorderedCards.splice(result.destination.index, 0, removed);

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
    
    onSave([...selectedCards, newCard]);
    
    // Start editing the new card
    setEditingCardId(newCard.id);
    setEditTitle(newCard.title);
    setEditContent(newCard.content);
    setEditDuration('');
  };

  // Remove a card
  const handleRemoveCard = (id: string) => {
    onSave(selectedCards.filter(card => card.id !== id));
    
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
    const updatedCards = selectedCards.map(card => {
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
    
    onSave([...selectedCards, newCard]);
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
    
    onSave([...selectedCards, newCard]);
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
    
    onSave([...selectedCards, newCard]);
  };

  // Toggle a card between teacher and student versions
  const toggleCardMode = (cardId: string) => {
    const cardIndex = selectedCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = selectedCards[cardIndex];
    
    // Only toggle if we have both versions
    if (!card.studentFriendly || !card.originalContent) return;
    
    const updatedCards = [...selectedCards];
    updatedCards[cardIndex] = {
      ...card,
      content: card.studentFriendly ? card.originalContent : card.content,
      studentFriendly: !card.studentFriendly,
      isDifferentiated: false // Reset differentiated state when toggling
    };
    
    onSave(updatedCards);
  };

  // Toggle a card between standard and differentiated versions
  const toggleDifferentiated = (cardId: string) => {
    const cardIndex = selectedCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = selectedCards[cardIndex];
    
    // Only toggle if differentiated content exists
    if (!card.differentiatedContent) return;
    
    // Keep track of which content we should revert to
    const regularContent = card.isDifferentiated 
      ? (card.studentFriendly ? card.content : card.originalContent || card.content)
      : card.content;
    
    const updatedCards = [...selectedCards];
    updatedCards[cardIndex] = {
      ...card,
      content: card.isDifferentiated ? regularContent : card.differentiatedContent,
      isDifferentiated: !card.isDifferentiated
    };
    
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
            className="mb-4 rounded-xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
          >
            {/* Always render the header with drag handle */}
            <div className="flex items-center p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex-grow">
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
                        <Wand2 className="h-4 w-4" />
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
                          <GraduationCap className="h-4 w-4" />
                        ) : (
                          <UserCircle className="h-4 w-4" />
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
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <BookMarked className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditCard(card)}
                      className="p-1 text-gray-500 hover:text-indigo-600 rounded-full"
                      title="Edit card"
                    >
                      <PencilRuler className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveCard(card.id)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded-full"
                      title="Remove card"
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
                    rows={6}
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
                
                <div className="flex justify-end gap-2">
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
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                <div dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(card.content)
                }}></div>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap">
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
              <ListChecks className="h-4 w-4" />
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
            <Lightbulb className="h-4 w-4 mr-1" />
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
            <FileEdit className="h-4 w-4 mr-1" />
            Add Custom Card
          </Button>
        </div>
      </div>
      
      {criteriaMessage && (
        <div className={`p-3 rounded-lg ${
          criteriaMessage.type === 'success' 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {criteriaMessage.text}
        </div>
      )}
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4 flex-wrap">
          <h3 className="font-medium">Card Sequence ({selectedCards.length} cards)</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={makeAllCardsStudentFriendly}
              disabled={processingAllCards || selectedCards.length === 0}
              className="flex items-center gap-1"
            >
              {processingAllCards ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserCircle className="h-4 w-4" />
                  Make Accessible for Students
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createDifferentiatedCards}
              disabled={generatingDifferentiated || selectedCards.length === 0}
              className="flex items-center gap-1"
            >
              {generatingDifferentiated ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BookMarked className="h-4 w-4" />
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
                {selectedCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                    No cards added yet. Add cards from the lesson plan or create custom cards.
                  </div>
                ) : (
                  selectedCards.map((card, index) => renderCard(card, index))
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