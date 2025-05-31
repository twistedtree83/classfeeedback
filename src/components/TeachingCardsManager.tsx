import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Plus, X, GripVertical } from 'lucide-react';
import type { LessonCard, ProcessedLesson, LessonSection } from '../lib/types';

interface TeachingCardsManagerProps {
  lesson: ProcessedLesson;
  onSave: (cards: LessonCard[]) => void;
}

export function TeachingCardsManager({ lesson, onSave }: TeachingCardsManagerProps) {
  const [selectedCards, setSelectedCards] = useState<LessonCard[]>([]);

  const createCard = (type: string, title: string, content: string, duration?: string | null, sectionId?: string | null, activityIndex?: number | null): LessonCard => {
    return {
      id: crypto.randomUUID(),
      type: type as 'objective' | 'material' | 'section' | 'activity',
      title,
      content,
      duration: duration || null,
      sectionId: sectionId || null,
      activityIndex: typeof activityIndex === 'number' && !isNaN(activityIndex) ? activityIndex : null
    };
  };

  const handleAddCard = (card: LessonCard) => {
    setSelectedCards(prev => [...prev, { ...card, id: crypto.randomUUID() }]);
  };

  const handleRemoveCard = (index: number) => {
    setSelectedCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(selectedCards);
  };

  const createObjectiveCard = () => createCard(
    'objective',
    'Learning Objectives',
    lesson.objectives.map(obj => `• ${obj}`).join('\n')
  );

  const createMaterialsCard = () => createCard(
    'material',
    'Required Materials',
    lesson.materials.map(mat => `• ${mat}`).join('\n')
  );

  const createSectionCard = (section: LessonSection) => createCard(
    'section',
    section.title,
    section.content,
    section.duration || null,
    section.id
  );

  const createActivityCard = (section: LessonSection, activity: string, index: number) => createCard(
    'activity',
    `Activity: ${section.title}`,
    activity,
    null,
    section.id,
    index
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Teaching Cards</h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddCard(createObjectiveCard())}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Objectives
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddCard(createMaterialsCard())}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Materials
          </Button>
        </div>

        <div className="space-y-2">
          {lesson.sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{section.title}</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCard(createSectionCard(section))}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Content
                </Button>
                {section.activities.map((activity, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCard(createActivityCard(section, activity, index))}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 mt-6">
        <h4 className="font-medium mb-4">Selected Cards</h4>
        {selectedCards.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No cards selected. Add some cards to create your lesson flow.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedCards.map((card, index) => (
              <div
                key={card.id}
                className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg"
              >
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                <div className="flex-grow">
                  <div className="font-medium">{card.title}</div>
                  {card.duration && (
                    <div className="text-sm text-gray-500">{card.duration}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCard(index)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={selectedCards.length === 0}
        >
          Save Teaching Cards
        </Button>
      </div>
    </div>
  );
}