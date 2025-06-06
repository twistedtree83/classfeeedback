import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { improveLessonSection } from '@/lib/aiService';
import { Loader2, CheckCircle, XCircle, Edit, Sparkles, Plus, Trash2 } from 'lucide-react';
import { ImprovementArea } from '@/types/lessonTypes';
import { sanitizeHtml } from '@/lib/utils';

interface SectionImproverProps {
  improvement: ImprovementArea;
  currentValue: string | string[];
  onApprove: (id: string, newValue: string | string[]) => void;
  onCancel: () => void;
}

export function SectionImprover({
  improvement,
  currentValue,
  onApprove,
  onCancel
}: SectionImproverProps) {
  const [editMode, setEditMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activities, setActivities] = useState<string[]>(Array.isArray(currentValue) ? 
    [...currentValue] : 
    currentValue ? [currentValue as string] : []);
  const [error, setError] = useState('');

  // Function to generate improved content from AI
  const generateImprovement = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // For arrays (like activities), join with newlines
      const currentText = (Array.isArray(currentValue) ? 
        currentValue : 
        currentValue ? [currentValue as string] : []).join('\n');
      
      const result = await improveLessonSection(
        improvement.section,
        currentText,
        improvement.issue
      );
      
      // Process the result into a clean array of activities
      const processedActivities = cleanAndParseActivities(result);
      setActivities(processedActivities);
      
    } catch (err) {
      console.error('Error improving section:', err);
      setError('Failed to generate improvement. Please try again or edit manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Clean and parse activities from AI response
  const cleanAndParseActivities = (aiResponse: string): string[] => {
    // Split by common separators (newlines, bullet points, numbers)
    const lines = aiResponse.split(/\n+/);
    
    // Process each line to remove bullet points, numbering, etc.
    return lines
      .map(line => {
        // Remove bullet points, numbers, and extra whitespace
        return line.trim()
          .replace(/^[•\-*]\s*/, '')  // Bullet points
          .replace(/^\d+[.):]\s*/, '') // Numbering
          .trim();
      })
      .filter(line => line.length > 0); // Remove empty lines
  };

  // Generate improvement when component mounts
  useEffect(() => {
    generateImprovement();
  }, []);

  // Handle editing for array fields (like activities)
  const handleActivityChange = (index: number, value: string) => {
    const newActivities = [...activities];
    newActivities[index] = value;
    setActivities(newActivities);
  };

  // Handle adding a new array item
  const handleAddActivity = () => {
    setActivities([...activities, '']);
  };

  // Handle removing an array item
  const handleRemoveActivity = (index: number) => {
    const newActivities = [...activities];
    newActivities.splice(index, 1);
    setActivities(newActivities);
  };

  // Handle approving the changes
  const handleApprove = () => {
    onApprove(improvement.id, activities);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Improve Activities for {improvement.section}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={`${editMode ? 'bg-blue-50 text-blue-600' : ''}`}
            onClick={() => setEditMode(!editMode)}
          >
            <Edit className="h-4 w-4 mr-1" />
            {editMode ? 'Exit Edit' : 'Edit'}
          </Button>
          
          {!isGenerating && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateImprovement}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">
          <strong>Issue:</strong> {improvement.issue}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Activities:</h4>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {Array.isArray(currentValue) ? (
              <ul className="list-disc pl-5 space-y-2">
                {currentValue.length > 0 ? (
                  currentValue.map((item, i) => (
                    <li key={i} className="text-gray-700">{item}</li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No activities defined</li>
                )}
              </ul>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{currentValue as string || <span className="text-gray-400 italic">No content</span>}</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Improved Activities:</h4>
          
          {isGenerating ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
              <span>Generating improved activities...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
              {error}
            </div>
          ) : (
            <>
              {editMode ? (
                <div>
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <textarea
                          value={activity}
                          onChange={(e) => handleActivityChange(index, e.target.value)}
                          className="flex-1 p-3 border border-blue-200 rounded focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                          rows={3}
                          placeholder={`Activity ${index + 1} description...`}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => handleRemoveActivity(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddActivity}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> 
                      Add Activity
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <ul className="list-disc pl-5 space-y-2">
                    {activities.length > 0 ? (
                      activities.map((item, i) => (
                        <li key={i} className="text-blue-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}></li>
                      ))
                    ) : (
                      <li className="text-blue-400 italic">No activities defined yet</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={handleApprove}
          disabled={isGenerating || activities.length === 0}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Apply These Activities
        </Button>
      </div>
    </div>
  );
}