import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { LessonSection } from '../lib/types';
import { Trash2, GripVertical } from 'lucide-react';

interface SectionEditorProps {
  section: LessonSection;
  onUpdate: (updatedSection: LessonSection) => void;
  onDelete: () => void;
  isProcessing?: boolean;
}

export function SectionEditor({ 
  section, 
  onUpdate, 
  onDelete,
  isProcessing 
}: SectionEditorProps) {
  const [activities, setActivities] = useState<string[]>(section.activities);

  const handleActivityChange = (index: number, value: string) => {
    const newActivities = [...activities];
    newActivities[index] = value;
    
    setActivities(newActivities);
    onUpdate({
      ...section,
      activities: newActivities
    });
  };

  const handleAddActivity = () => {
    const newActivities = [...activities, ''];
    setActivities(newActivities);
    onUpdate({
      ...section,
      activities: newActivities
    });
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = activities.filter((_, i) => i !== index);
    setActivities(newActivities);
    onUpdate({
      ...section,
      activities: newActivities
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="cursor-move text-gray-400">
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex-grow">
          <Input
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            placeholder="Section Title"
            disabled={isProcessing}
          />
        </div>
        
        <div className="w-32">
          <Input
            value={section.duration}
            onChange={(e) => onUpdate({ ...section, duration: e.target.value })}
            placeholder="Duration"
            disabled={isProcessing}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={isProcessing}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <textarea
          value={section.content}
          onChange={(e) => onUpdate({ ...section, content: e.target.value })}
          placeholder="Section content..."
          className="w-full h-32 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isProcessing}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-700">Activities</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddActivity}
            disabled={isProcessing}
          >
            Add Activity
          </Button>
        </div>
        
        {activities.map((activity, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={activity}
              onChange={(e) => handleActivityChange(index, e.target.value)}
              placeholder={`Activity ${index + 1}`}
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveActivity(index)}
              disabled={isProcessing}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-2">Assessment</h4>
        <textarea
          value={section.assessment}
          onChange={(e) => onUpdate({ ...section, assessment: e.target.value })}
          placeholder="How will you assess student understanding?"
          className="w-full h-24 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}