import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { LessonCard, ProcessedLesson } from '../lib/types';
import { Plus, X, GripVertical, Edit, Save, BookOpen } from 'lucide-react';

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
    const newCard: LessonCard = {
      id: crypto.randomUUID(),
      type: 'objective',
      title: 'Learning Objectives',
      content: lesson.objectives.map(obj => `• ${obj}`).join('\n'),
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

  // Render a card based on its state (normal or editing)
  const renderCard = (card: LessonCard, index: number) => {
    const isEditing = editingCardId === card.id;
    
    return (
      <Draggable key={card.id} draggableId={card.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-4 border rounded-lg bg-white shadow-sm"
          >
            {isEditing ? (
              // Editing view
              <div className="p-4">
                <div className="mb-4">
                  <Input
                    label="Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                
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
              // Normal view
              <div>
                <div className="flex items-center p-3 border-b">
                  <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{card.title}</h3>
                    {card.duration && (
                      <div className="text-sm text-gray-500">{card.duration}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
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
                  </div>
                </div>
                <div className="p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {card.content.length > 150
                    ? `${card.content.substring(0, 150)}...`
                    : card.content}
                </div>
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
            onClick={createObjectiveCard}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Objectives
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
        <h3 className="font-medium mb-4">Card Sequence ({cards.length} cards)</h3>
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