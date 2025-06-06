import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui-shadcn/card';
import { Button } from '@/components/ui/button';
import { ImprovementArea } from '@/types/lessonTypes';
import { sanitizeHtml } from '@/lib/utils';

interface ImprovementSuggestionProps {
  improvement: ImprovementArea;
  currentValue: string | string[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCustomEdit: (id: string) => void;
  isApproved: boolean;
  isRejected: boolean;
}

export function ImprovementSuggestion({
  improvement,
  currentValue,
  onApprove,
  onReject,
  onCustomEdit,
  isApproved,
  isRejected
}: ImprovementSuggestionProps) {
  // Format the current value for display
  const formatValue = (value: string | string[]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <div className="text-gray-400 italic">No activities defined</div>;
      }
      return (
        <ul className="list-disc pl-5 space-y-1">
          {value.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    return value || <div className="text-gray-400 italic">No content</div>;
  };

  // Get color for priority badge
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status badge
  const StatusBadge = () => {
    if (isApproved) {
      return (
        <div className="flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Applied
        </div>
      );
    }
    
    if (isRejected) {
      return (
        <div className="flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-4 w-4 mr-1" />
          Not Applied
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card className={`${isApproved ? 'border-green-200' : isRejected ? 'border-gray-200 opacity-75' : 'border-amber-200'} shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center">
              <Lightbulb className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <span>Activities for {improvement.section}</span>
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(improvement.priority)}`}>
                {improvement.priority.charAt(0).toUpperCase() + improvement.priority.slice(1)} Priority
              </span>
              <StatusBadge />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Issue:</h4>
            <p className="text-sm text-gray-600">{improvement.issue}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Current Activities:</h4>
              <div className="text-sm text-gray-600">
                {formatValue(currentValue)}
              </div>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Suggested Activities:</h4>
              <div 
                className="text-sm text-amber-700"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(improvement.suggestion) }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {!isApproved && !isRejected && (
        <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            className="text-gray-600"
            onClick={() => onReject(improvement.id)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Skip
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => onCustomEdit(improvement.id)}
          >
            Edit Activities
          </Button>
          <Button 
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onApprove(improvement.id)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Apply Suggestion
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}