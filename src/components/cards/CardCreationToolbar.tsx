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
      <div className="modern-card hover-lift p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-white/30">
        <h3 className="text-lg font-semibold text-dark-purple mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-brand-primary" />
          Quick Add Cards
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            onClick={onCreateObjectiveCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center border-dark-purple/30 text-dark-purple hover:bg-dark-purple/10"
          >
            <Target className="h-6 w-6 text-dark-purple" />
            <span className="text-sm font-medium">Learning Objectives</span>
          </Button>

          <Button
            onClick={onCreateMaterialsCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
          >
            <BookOpen className="h-6 w-6 text-harvest-gold" />
            <span className="text-sm font-medium">Materials</span>
          </Button>

          <Button
            onClick={onCreateTopicBackgroundCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center border-bice-blue/30 text-bice-blue hover:bg-bice-blue/10"
          >
            <Lightbulb className="h-6 w-6 text-bice-blue" />
            <span className="text-sm font-medium">Topic Background</span>
          </Button>

          <Button
            onClick={onCreateSectionCards}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
          >
            <BookMarked className="h-6 w-6 text-deep-sky-blue" />
            <span className="text-sm font-medium">All Sections</span>
          </Button>

          <Button
            onClick={onAddCustomCard}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 text-center border-muted-foreground/30 text-muted-foreground hover:bg-muted/10"
          >
            <FileEdit className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">Custom Card</span>
          </Button>
        </div>
      </div>

      {/* AI Enhancement Section */}
      <div className="modern-card hover-lift p-6 bg-gradient-to-br from-brand-primary/5 via-deep-sky-blue/5 to-harvest-gold/5 border border-brand-primary/20 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-dark-purple mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-primary" />
          AI Enhancement Tools
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Success Criteria Generation */}
          <div className="space-y-2">
            <Button
              onClick={onGenerateSuccessCriteria}
              disabled={generatingCriteria}
              variant="outline"
              className="w-full flex items-center gap-2 border-sea-green/30 text-sea-green hover:bg-sea-green/10"
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
              <p className="text-sm text-muted-foreground bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-soft">
                {criteriaMessage}
              </p>
            )}

            {successCriteria.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-soft">
                <h4 className="text-sm font-medium text-dark-purple mb-2">
                  Generated Success Criteria:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {successCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-sea-green mt-0.5">•</span>
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
              className="w-full flex items-center gap-2 border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
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
              <p className="text-sm text-muted-foreground bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-soft">
                {intentionsMessage}
              </p>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-brand-primary/20">
          <Button
            onClick={onMakeAllStudentFriendly}
            disabled={processingAllCards}
            variant="outline"
            className="flex items-center gap-2 border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
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
            className="flex items-center gap-2 border-bice-blue/30 text-bice-blue hover:bg-bice-blue/10"
          >
            <Users className="h-4 w-4" />
            Create Differentiated Cards
          </Button>

          <Button
            onClick={onToggleDifferentiatedSelector}
            variant="outline"
            className="flex items-center gap-2 border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
          >
            <Users className="h-4 w-4" />
            Select Cards for Differentiation
          </Button>
        </div>
      </div>
    </div>
  );
}
