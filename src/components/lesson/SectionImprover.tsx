import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { improveLessonSection } from '@/lib/aiService';
import { Loader2, CheckCircle, XCircle, Edit, Sparkles } from 'lucide-react';
import { ImprovementArea } from '@/types/lessonTypes';

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
  const [suggestedValue, setSuggestedValue] = useState<string | string[]>(currentValue);
  const [error, setError] = useState('');

  const isArrayValue = Array.isArray(currentValue);

  // Function to generate improved content from AI
  const generateImprovement = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      let result;
      
      if (isArrayValue) {
        // For arrays (like objectives or materials), join with newlines
        const currentText = (currentValue as string[]).join('\n');
        result = await improveLessonSection(
          improvement.section,
          currentText,
          improvement.issue
        );
        // Split back into an array
        setSuggestedValue(result.split('\n').map(line => line.trim()).filter(line => line.length > 0));
      } else {
        // For string values
        result = await improveLessonSection(
          improvement.section,
          currentValue as string,
          improvement.issue
        );
        setSuggestedValue(result);
      }
      
    } catch (err) {
      console.error('Error improving section:', err);
      setError('Failed to generate improvement. Please try again or edit manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate improvement when component mounts
  React.useEffect(() => {
    generateImprovement();
  }, []);

  // Handle editing for text fields
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSuggestedValue(e.target.value);
  };

  // Handle editing for array fields (like objectives)
  const handleArrayItemChange = (index: number, value: string) => {
    if (isArrayValue) {
      const newArray = [...(suggestedValue as string[])];
      newArray[index] = value;
      setSuggestedValue(newArray);
    }
  };

  // Handle adding a new array item
  const handleAddArrayItem = () => {
    if (isArrayValue) {
      setSuggestedValue([...(suggestedValue as string[]), '']);
    }
  };

  // Handle removing an array item
  const handleRemoveArrayItem = (index: number) => {
    if (isArrayValue) {
      const newArray = [...(suggestedValue as string[])];
      newArray.splice(index, 1);
      setSuggestedValue(newArray);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Improve {improvement.section}
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Content:</h4>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            {isArrayValue ? (
              <ul className="list-disc pl-5 space-y-1">
                {(currentValue as string[]).map((item, i) => (
                  <li key={i} className="text-gray-700">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{currentValue as string}</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Improved Content:</h4>
          
          {isGenerating ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
              <span>Generating improvement...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
              {error}
            </div>
          ) : (
            <>
              {editMode ? (
                <div>
                  {isArrayValue ? (
                    <div className="space-y-2">
                      {(suggestedValue as string[]).map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <textarea
                            value={item}
                            onChange={(e) => handleArrayItemChange(index, e.target.value)}
                            className="flex-1 p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                            rows={2}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500"
                            onClick={() => handleRemoveArrayItem(index)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddArrayItem}
                      >
                        + Add Item
                      </Button>
                    </div>
                  ) : (
                    <textarea
                      value={suggestedValue as string}
                      onChange={handleTextChange}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                      rows={8}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  {isArrayValue ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {(suggestedValue as string[]).map((item, i) => (
                        <li key={i} className="text-blue-700">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-blue-700 whitespace-pre-wrap">{suggestedValue as string}</p>
                  )}
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
          onClick={() => onApprove(improvement.id, suggestedValue)}
          disabled={isGenerating}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Apply This Improvement
        </Button>
      </div>
    </div>
  );
}