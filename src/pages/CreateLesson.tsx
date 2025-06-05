import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { extractTextFromFile } from '../lib/documentParser';
import { aiAnalyzeLesson, generateSuccessCriteria, improveLessonSection, ImprovementArea } from '../lib/aiService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { ProcessedLesson } from '../lib/types';
import { LessonPreview } from '../components/LessonPreview';
import { supabase } from '../lib/supabase/client';
import { ImprovementSuggestion } from '@/components/lesson/ImprovementSuggestion';
import { SectionImprover } from '@/components/lesson/SectionImprover';
import { ImprovedField } from '@/types/lessonTypes';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, CheckCircle, ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';
import { LoadingProgress } from '@/components/LoadingProgress';

export function CreateLesson() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Basic lesson data
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'improve' | 'preview' | 'saving'>('upload');
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  
  // Content state
  const [processedContent, setProcessedContent] = useState<ProcessedLesson | null>(null);
  const [improvementAreas, setImprovementAreas] = useState<ImprovementArea[]>([]);
  const [improvedFields, setImprovedFields] = useState<ImprovedField[]>([]);
  const [editingImprovement, setEditingImprovement] = useState<ImprovementArea | null>(null);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setProcessedContent(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProcessedContent(null);
    setError(null);
  };

  // Process the uploaded file
  const handleProcess = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Please provide both a title and a file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProcessingStep('Extracting text from document...');

    try {
      // Extract text from file
      const text = await extractTextFromFile(selectedFile);
      console.log('Extracted text:', text.slice(0, 500)); // Log first 500 chars
      
      setProgress(20);
      setProcessingStep('Analyzing lesson content...');
      
      // Analyze the text to create structured lesson plan
      const analyzed = await aiAnalyzeLesson(text, level);
      
      if (!analyzed || !analyzed.data) {
        throw new Error('Failed to analyze lesson plan');
      }
      
      setProgress(60);
      setProcessingStep('Generating success criteria...');
      
      // Generate success criteria based on objectives
      const criteria = await generateSuccessCriteria(analyzed.data.objectives, level);
      
      setProgress(80);
      setProcessingStep('Finalizing lesson plan...');
      
      const processedLesson: ProcessedLesson = {
        id: crypto.randomUUID(),
        ...analyzed.data,
        title: title.trim(), // Override the AI-generated title with user's title
        level: level.trim(), // Add the lesson level
        success_criteria: criteria // Add success criteria
      };
      
      setProgress(100);
      setProcessedContent(processedLesson);
      setImprovementAreas(analyzed.improvementAreas || []);
      
      // Move to improvement step
      setStep('improve');
    } catch (err) {
      console.error('Error processing lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to process lesson plan');
      setProcessedContent(null);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Get the current value of a field by its path
  const getFieldValueByPath = useCallback((path: string): any => {
    if (!processedContent) return null;
    
    const parts = path.split('.');
    let current: any = processedContent;
    
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
  }, [processedContent]);

  // Update a field value by path
  const updateFieldByPath = (path: string, newValue: any): ProcessedLesson => {
    if (!processedContent) return processedContent as ProcessedLesson;
    
    const parts = path.split('.');
    const result = JSON.parse(JSON.stringify(processedContent)); // Deep clone
    
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
  };

  // Handle improving a field with AI
  const handleApproveImprovement = (improvementId: string, newValue: string | string[]) => {
    const improvement = improvementAreas.find(imp => imp.id === improvementId);
    if (!improvement || !processedContent) return;

    // Update the lesson content with the improved content
    const updatedContent = updateFieldByPath(improvement.fieldPath, newValue);
    setProcessedContent(updatedContent);
    
    // Record that this field was improved
    setImprovedFields([
      ...improvedFields,
      {
        fieldPath: improvement.fieldPath,
        originalValue: getFieldValueByPath(improvement.fieldPath),
        suggestedValue: newValue,
        approved: true
      }
    ]);
    
    // Close the editor
    setEditingImprovement(null);
  };

  // Handle skipping an improvement
  const handleRejectImprovement = (improvementId: string) => {
    const improvement = improvementAreas.find(imp => imp.id === improvementId);
    if (!improvement) return;

    // Record that this field was not improved
    setImprovedFields([
      ...improvedFields,
      {
        fieldPath: improvement.fieldPath,
        originalValue: getFieldValueByPath(improvement.fieldPath),
        suggestedValue: null,
        approved: false
      }
    ]);
  };

  // Function to save the final lesson
  const saveLesson = async () => {
    if (!processedContent) return;
    
    setStep('saving');
    try {
      console.log('Saving lesson plan:', processedContent);

      const { error: saveError } = await supabase
        .from('lesson_plans')
        .insert([{
          id: processedContent.id,
          title: processedContent.title,
          processed_content: processedContent,
          level: processedContent.level,
          user_id: user?.id
        }]);

      if (saveError) {
        console.error('Database error:', saveError);
        throw new Error(`Failed to save lesson plan: ${saveError.message}`);
      }

      // Navigate to the lesson details page
      navigate(`/planner/${processedContent.id}`);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to save lesson plan');
      setStep('preview');
    }
  };

  // Check if an improvement has been addressed
  const isImprovementHandled = useCallback((id: string) => {
    return improvedFields.some(field => {
      const improvement = improvementAreas.find(imp => imp.id === id);
      return improvement && field.fieldPath === improvement.fieldPath;
    });
  }, [improvedFields, improvementAreas]);

  // Get all unhandled improvements
  const unhandledImprovements = improvementAreas.filter(
    imp => !isImprovementHandled(imp.id)
  );

  // Check if we have a specific improvement being edited
  const fieldBeingEdited = editingImprovement 
    ? getFieldValueByPath(editingImprovement.fieldPath)
    : null;

  // Function to get improvements for specific section types
  const getImprovementsForSection = (section: 'main' | 'objectives' | 'materials' | 'background' | 'sections') => {
    return improvementAreas.filter(imp => {
      // Match by field path pattern
      if (section === 'objectives' && imp.fieldPath.startsWith('objectives')) {
        return true;
      }
      if (section === 'materials' && imp.fieldPath.startsWith('materials')) {
        return true;
      }
      if (section === 'background' && imp.fieldPath.startsWith('topic_background')) {
        return true;
      }
      if (section === 'sections' && imp.fieldPath.startsWith('sections')) {
        return true;
      }
      
      // Main is for anything not in specific sections
      if (section === 'main' && 
          !imp.fieldPath.startsWith('objectives') && 
          !imp.fieldPath.startsWith('materials') &&
          !imp.fieldPath.startsWith('topic_background') &&
          !imp.fieldPath.startsWith('sections')) {
        return true;
      }
      
      return false;
    });
  };

  // Get the count of improvements for a section
  const getImprovementsCount = (section: 'main' | 'objectives' | 'materials' | 'background' | 'sections') => {
    return getImprovementsForSection(section).length;
  };

  // Get the count of approved improvements for a section
  const getApprovedCount = (section: 'main' | 'objectives' | 'materials' | 'background' | 'sections') => {
    const sectionImprovements = getImprovementsForSection(section);
    return sectionImprovements.filter(imp => isImprovementHandled(imp.id)).length;
  };

  // Based on the current step, render the appropriate view
  if (step === 'upload') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Lesson Plan</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Input
              label="Lesson Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your lesson"
              disabled={isProcessing}
            />

            <div className="space-y-2">
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                Lesson Level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select grade level</option>
                <option value="Kindergarten">Kindergarten</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload Lesson Plan
              </label>
              <FileUpload
                onFileUpload={handleFileUpload}
                selectedFile={selectedFile}
                onRemoveFile={handleRemoveFile}
                isProcessing={isProcessing}
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={handleProcess}
              disabled={!selectedFile || !title.trim() || isProcessing}
              className="w-full"
              isLoading={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Lesson Plan'}
            </Button>
          </div>

          <div>
            {isProcessing && (
              <div className="flex flex-col justify-center items-center h-full">
                <LoadingProgress 
                  progress={progress} 
                  step={processingStep} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'improve' && processedContent) {
    // If we're editing a specific improvement
    if (editingImprovement && fieldBeingEdited !== null) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-4">
            <button
              onClick={() => setEditingImprovement(null)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to improvements
            </button>
          </div>
          
          <SectionImprover
            improvement={editingImprovement}
            currentValue={fieldBeingEdited}
            onApprove={handleApproveImprovement}
            onCancel={() => setEditingImprovement(null)}
          />
        </div>
      );
    }
    
    // Display the improvement suggestions
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Improve Your Lesson Plan</h1>
          <p className="text-gray-600">
            Our AI has analyzed your lesson plan and identified areas that could be improved. 
            Review each suggestion and decide whether to apply it to your lesson.
          </p>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Improvement Suggestions</h3>
              <p className="text-yellow-700 text-sm">
                We've identified {improvementAreas.length} areas where your lesson plan could be improved. 
                You can apply these suggestions or skip them.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className={`col-span-6 md:col-span-3 lg:col-span-2 p-4 rounded-lg border ${getApprovedCount('main') === getImprovementsCount('main') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">General</h3>
              <span className="text-sm">{getApprovedCount('main')}/{getImprovementsCount('main')}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{width: `${getImprovementsCount('main') ? (getApprovedCount('main') / getImprovementsCount('main') * 100) : 0}%`}}
              ></div>
            </div>
          </div>
          
          <div className={`col-span-6 md:col-span-3 lg:col-span-2 p-4 rounded-lg border ${getApprovedCount('objectives') === getImprovementsCount('objectives') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Objectives</h3>
              <span className="text-sm">{getApprovedCount('objectives')}/{getImprovementsCount('objectives')}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{width: `${getImprovementsCount('objectives') ? (getApprovedCount('objectives') / getImprovementsCount('objectives') * 100) : 0}%`}}
              ></div>
            </div>
          </div>
          
          <div className={`col-span-6 md:col-span-3 lg:col-span-2 p-4 rounded-lg border ${getApprovedCount('materials') === getImprovementsCount('materials') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Materials</h3>
              <span className="text-sm">{getApprovedCount('materials')}/{getImprovementsCount('materials')}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{width: `${getImprovementsCount('materials') ? (getApprovedCount('materials') / getImprovementsCount('materials') * 100) : 0}%`}}
              ></div>
            </div>
          </div>
          
          <div className={`col-span-6 md:col-span-3 lg:col-span-3 p-4 rounded-lg border ${getApprovedCount('background') === getImprovementsCount('background') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Background</h3>
              <span className="text-sm">{getApprovedCount('background')}/{getImprovementsCount('background')}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{width: `${getImprovementsCount('background') ? (getApprovedCount('background') / getImprovementsCount('background') * 100) : 0}%`}}
              ></div>
            </div>
          </div>
          
          <div className={`col-span-6 md:col-span-3 lg:col-span-3 p-4 rounded-lg border ${getApprovedCount('sections') === getImprovementsCount('sections') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Sections</h3>
              <span className="text-sm">{getApprovedCount('sections')}/{getImprovementsCount('sections')}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{width: `${getImprovementsCount('sections') ? (getApprovedCount('sections') / getImprovementsCount('sections') * 100) : 0}%`}}
              ></div>
            </div>
          </div>
        </div>

        {/* Display unhandled improvements first */}
        {unhandledImprovements.length > 0 ? (
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
              Suggested Improvements
            </h2>
            
            {unhandledImprovements.map(improvement => (
              <ImprovementSuggestion
                key={improvement.id}
                improvement={improvement}
                currentValue={getFieldValueByPath(improvement.fieldPath) || ''}
                onApprove={(id) => setEditingImprovement(improvement)}
                onReject={handleRejectImprovement}
                onCustomEdit={(id) => setEditingImprovement(improvement)}
                isApproved={false}
                isRejected={false}
              />
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">All Improvements Reviewed!</h3>
            <p className="text-green-700">You've addressed all the suggested improvements for your lesson plan.</p>
          </div>
        )}

        {/* Already handled improvements */}
        {improvedFields.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Addressed Improvements
            </h2>
            
            {improvedFields.map(field => {
              const improvement = improvementAreas.find(imp => imp.fieldPath === field.fieldPath);
              if (!improvement) return null;
              
              return (
                <ImprovementSuggestion
                  key={improvement.id}
                  improvement={improvement}
                  currentValue={field.originalValue || ''}
                  onApprove={() => {}}
                  onReject={() => {}}
                  onCustomEdit={() => {}}
                  isApproved={field.approved}
                  isRejected={!field.approved}
                />
              );
            })}
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep('upload')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Upload
          </Button>
          
          <Button
            onClick={() => setStep('preview')}
          >
            Continue to Preview
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'preview' && processedContent) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Preview Your Lesson Plan</h1>
          <p className="text-gray-600">
            Review your lesson plan before saving. You can go back to make additional improvements if needed.
          </p>
        </div>

        <div className="mb-6">
          <LessonPreview lesson={processedContent} />
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep('improve')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Improvements
          </Button>
          
          <Button
            onClick={saveLesson}
          >
            Save Lesson Plan
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'saving') {
    return (
      <div className="max-w-6xl mx-auto p-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Saving Your Lesson Plan</h2>
          <p className="text-gray-600">Please wait while we save your lesson plan...</p>
        </div>
      </div>
    );
  }

  return null;
}