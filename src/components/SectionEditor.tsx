import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { LessonSection } from '../lib/types';
import { Trash2, GripVertical, Wand, ExternalLink } from 'lucide-react';
import { ActivityExpander } from './ActivityExpander';

interface SectionEditorProps {
  section: LessonSection;
  onUpdate: (updatedSection: LessonSection) => void;
  onDelete: () => void;
  isProcessing?: boolean;
  lessonContext?: string;
  lessonLevel?: string;
}

export function SectionEditor({ 
  section, 
  onUpdate, 
  onDelete,
  isProcessing,
  lessonContext = '',
  lessonLevel = ''
}: SectionEditorProps) {
  const [activities, setActivities] = useState<string[]>(section.activities);
  const [expandingActivityIndex, setExpandingActivityIndex] = useState<number | null>(null);

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

  const handleExpandActivity = (index: number) => {
    setExpandingActivityIndex(index);
  };

  const handleExpandedActivity = (expanded: string) => {
    if (expandingActivityIndex !== null) {
      handleActivityChange(expandingActivityIndex, expanded);
      setExpandingActivityIndex(null);
    }
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
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-grow">
              <Input
                value={activity}
                onChange={(e) => handleActivityChange(index, e.target.value)}
                placeholder={`Activity ${index + 1}`}
                disabled={isProcessing}
              />
            </div>
            <div className="flex gap-1">
              {activity.trim().length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExpandActivity(index)}
                  title="Expand activity details with AI"
                  className="text-teal hover:bg-teal/10"
                >
                  <Wand className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveActivity(index)}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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

      {expandingActivityIndex !== null && activities[expandingActivityIndex] && (
        <ActivityExpander
          activity={activities[expandingActivityIndex]}
          context={lessonContext}
          level={lessonLevel}
          onExpandedActivity={handleExpandedActivity}
          onClose={() => setExpandingActivityIndex(null)}
        />
      )}
    </div>
  );
}