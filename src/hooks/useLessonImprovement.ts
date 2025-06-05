import { useState, useCallback, useEffect } from 'react';
import { ImprovementArea } from '@/types/lessonTypes';
import { ProcessedLesson } from '@/lib/types';
import { improveLessonSection } from '@/lib/aiService';

export interface ImprovedField {
  fieldPath: string;
  originalValue: any;
  suggestedValue: any;
  approved: boolean;
}

export function useLessonImprovement(
  initialLesson: ProcessedLesson | null,
  initialImprovements: ImprovementArea[]
) {
  const [lesson, setLesson] = useState<ProcessedLesson | null>(initialLesson);
  const [improvementAreas, setImprovementAreas] = useState<ImprovementArea[]>(initialImprovements);
  const [improvedFields, setImprovedFields] = useState<ImprovedField[]>([]);
  const [editingImprovement, setEditingImprovement] = useState<ImprovementArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state if props change
  useEffect(() => {
    if (initialLesson !== lesson) {
      setLesson(initialLesson);
    }
    
    if (initialImprovements !== improvementAreas) {
      setImprovementAreas(initialImprovements);
    }
  }, [initialLesson, initialImprovements]);

  // Get the current value of a field by its path
  const getFieldValueByPath = useCallback((path: string): any => {
    if (!lesson) return null;
    
    const parts = path.split('.');
    let current: any = lesson;
    
    for (const part of parts) {
      if (part.match(/^\d+$/)) {
        // Handle array indices
        const index = parseInt(part, 10);
        if (!Array.isArray(current) || index >= current.length) {
          return null;
        }
        current = current[index];
      } else {
        // Handle object properties
        if (current === null || current === undefined || typeof current !== 'object') {
          return null;
        }
        current = current[part];
      }
    }
    
    return current;
  }, [lesson]);

  // Update a field value by path
  const updateFieldByPath = useCallback((path: string, newValue: any): ProcessedLesson => {
    if (!lesson) return lesson as ProcessedLesson;
    
    const parts = path.split('.');
    const result = JSON.parse(JSON.stringify(lesson)); // Deep clone
    
    let current: any = result;
    
    // Navigate to the parent object that contains the field
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part.match(/^\d+$/)) {
        // Array index
        const index = parseInt(part, 10);
        if (!Array.isArray(current)) {
          return result;
        }
        current = current[index];
      } else {
        // Object property
        if (current === null || current === undefined || typeof current !== 'object') {
          return result;
        }
        if (!(part in current)) {
          current[part] = parts[i + 1].match(/^\d+$/) ? [] : {};
        }
        current = current[part];
      }
    }
    
    // Set the value on the final part
    const finalPart = parts[parts.length - 1];
    if (finalPart.match(/^\d+$/)) {
      const index = parseInt(finalPart, 10);
      if (Array.isArray(current) && index < current.length) {
        current[index] = newValue;
      }
    } else {
      current[finalPart] = newValue;
    }
    
    return result;
  }, [lesson]);

  // Handle approving an improvement
  const handleApproveImprovement = useCallback((improvementId: string, newValue: string | string[]) => {
    const improvement = improvementAreas.find(imp => imp.id === improvementId);
    if (!improvement || !lesson) return;

    // Update the lesson content with the improved content
    const updatedLesson = updateFieldByPath(improvement.fieldPath, newValue);
    setLesson(updatedLesson);
    
    // Record that this field was improved
    setImprovedFields(prev => [
      ...prev,
      {
        fieldPath: improvement.fieldPath,
        originalValue: getFieldValueByPath(improvement.fieldPath),
        suggestedValue: newValue,
        approved: true
      }
    ]);
    
    // Close the editor
    setEditingImprovement(null);
  }, [improvementAreas, lesson, getFieldValueByPath, updateFieldByPath]);

  // Handle rejecting an improvement
  const handleRejectImprovement = useCallback((improvementId: string) => {
    const improvement = improvementAreas.find(imp => imp.id === improvementId);
    if (!improvement) return;

    // Record that this field was not improved
    setImprovedFields(prev => [
      ...prev,
      {
        fieldPath: improvement.fieldPath,
        originalValue: getFieldValueByPath(improvement.fieldPath),
        suggestedValue: null,
        approved: false
      }
    ]);
  }, [improvementAreas, getFieldValueByPath]);

  // Check if an improvement has been addressed
  const isImprovementHandled = useCallback((id: string) => {
    return improvedFields.some(field => {
      const improvement = improvementAreas.find(imp => imp.id === id);
      return improvement && field.fieldPath === improvement.fieldPath;
    });
  }, [improvedFields, improvementAreas]);

  // Generate content improvement with AI
  const generateImprovement = useCallback(async (
    improvementId: string, 
    sectionType: string, 
    currentContent: string | string[],
    issueDescription: string
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let result;
      
      if (Array.isArray(currentContent)) {
        // For arrays (like activities), join with newlines
        const currentText = currentContent.join('\n');
        result = await improveLessonSection(
          sectionType,
          currentText,
          issueDescription
        );
        
        // Split back into an array and clean
        return result.split('\n')
          .map(line => line.trim().replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, ''))
          .filter(line => line.length > 0);
      } else {
        // For string values
        result = await improveLessonSection(
          sectionType,
          currentContent,
          issueDescription
        );
        return result;
      }
    } catch (err) {
      console.error('Error generating improvement:', err);
      setError('Failed to generate improvement. Please try again.');
      return currentContent;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get all unhandled improvements
  const unhandledImprovements = improvementAreas.filter(
    imp => !isImprovementHandled(imp.id)
  );

  return {
    lesson,
    improvementAreas,
    improvedFields,
    editingImprovement,
    unhandledImprovements,
    isProcessing,
    error,
    getFieldValueByPath,
    updateFieldByPath,
    handleApproveImprovement,
    handleRejectImprovement,
    setEditingImprovement,
    isImprovementHandled,
    generateImprovement
  };
}