import React from "react";
import { Button } from "../ui/Button";
import {
  Plus,
  Target,
  BookOpen,
  Sparkles,
  PencilRuler,
  Lightbulb,
  BookMarked,
  Wand2,
  FileEdit,
  ListChecks,
  Users,
  Loader2,
} from "lucide-react";
import type { ProcessedLesson } from "../../lib/types";

interface CardCreationToolbarProps {
  lesson: ProcessedLesson;
  successCriteria: string[];
  criteriaMessage: string;
  intentionsMessage: string;
  generatingCriteria: boolean;
  improvingIntentions: boolean;
  processingAllCards: boolean;
  onCreateObjectiveCard: () => void;
  onCreateMaterialsCard: () => void;
  onCreateTopicBackgroundCard: () => void;
  onCreateSectionCards: () => void;
  onAddCustomCard: () => void;
  onGenerateSuccessCriteria: () => void;
  onImproveLearningIntentions: () => void;
  onMakeAllStudentFriendly: () => void;
  onCreateDifferentiatedCards: () => void;
  onToggleDifferentiatedSelector: () => void;
}

export function CardCreationToolbar({
  lesson,
  successCriteria,
  criteriaMessage,
  intentionsMessage,
  generatingCriteria,
  improvingIntentions,
  processingAllCards,
  onCreateObjectiveCard,
  onCreateMaterialsCard,
  onCreateTopicBackgroundCard,
  onCreateSectionCards,
  onAddCustomCard,
  onGenerateSuccessCriteria,
  onImproveLearningIntentions,
  onMakeAllStudentFriendly,
  onCreateDifferentiatedCards,
  onToggleDifferentiatedSelector,
}: CardCreationToolbarProps) {
  return (
    <div className="space-y-6">
      {/* Quick Add Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          Quick Add Cards
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            onClick={onCreateObjectiveCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center"
          >
            <Target className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium">Learning Objectives</span>
          </Button>

          <Button
            onClick={onCreateMaterialsCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center"
          >
            <BookOpen className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium">Materials</span>
          </Button>

          <Button
            onClick={onCreateTopicBackgroundCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center"
          >
            <Lightbulb className="h-6 w-6 text-indigo-600" />
            <span className="text-sm font-medium">Topic Background</span>
          </Button>

          <Button
            onClick={onCreateSectionCards}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center"
          >
            <BookMarked className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium">All Sections</span>
          </Button>

          <Button
            onClick={onAddCustomCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center"
          >
            <FileEdit className="h-6 w-6 text-gray-600" />
            <span className="text-sm font-medium">Custom Card</span>
          </Button>
        </div>
      </div>

      {/* AI Enhancement Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          AI Enhancement Tools
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Success Criteria Generation */}
          <div className="space-y-2">
            <Button
              onClick={onGenerateSuccessCriteria}
              disabled={generatingCriteria}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              {generatingCriteria ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ListChecks className="h-4 w-4" />
              )}
              {generatingCriteria
                ? "Generating..."
                : "Generate Success Criteria"}
            </Button>

            {criteriaMessage && (
              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                {criteriaMessage}
              </p>
            )}

            {successCriteria.length > 0 && (
              <div className="bg-white p-3 rounded border">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Generated Success Criteria:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {successCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Learning Intentions Improvement */}
          <div className="space-y-2">
            <Button
              onClick={onImproveLearningIntentions}
              disabled={improvingIntentions}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              {improvingIntentions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PencilRuler className="h-4 w-4" />
              )}
              {improvingIntentions
                ? "Improving..."
                : "Improve Learning Intentions"}
            </Button>

            {intentionsMessage && (
              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                {intentionsMessage}
              </p>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-3 pt-4 border-t border-blue-200">
          <Button
            onClick={onMakeAllStudentFriendly}
            disabled={processingAllCards}
            variant="outline"
            className="flex items-center gap-2"
          >
            {processingAllCards ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {processingAllCards ? "Processing..." : "Make All Student-Friendly"}
          </Button>

          <Button
            onClick={onCreateDifferentiatedCards}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Create Differentiated Cards
          </Button>

          <Button
            onClick={onToggleDifferentiatedSelector}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Select Cards for Differentiation
          </Button>
        </div>
      </div>
    </div>
  );
}
