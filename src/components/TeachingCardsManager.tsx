import React from "react";
import { useTeachingCardsManager } from "../hooks/useTeachingCardsManager";
import { useLessonCardAI } from "../hooks/useLessonCardAI";
import { CardCreationToolbar } from "./cards/CardCreationToolbar";
import { CardsContainer } from "./cards/CardsContainer";
import { FileUploadModal } from "./FileUploadModal";
import { DifferentiatedCardsSelector } from "./DifferentiatedCardsSelector";
import { ActivityBulkExpander } from "./ActivityBulkExpander"; // Import the new component
import {
  createObjectiveCard,
  createMaterialsCard,
  createTopicBackgroundCard,
  createSectionCard,
  createActivityCard,
} from "../lib/cardFactory";
import type { LessonCard, ProcessedLesson } from "../lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Wand, 
  Palette, 
  Settings,
  Target,
  BookOpen,
  Lightbulb,
  BookMarked,
  FileEdit,
  PencilRuler,
  Wand2,
  Users,
  Loader2,
  CheckSquare,
} from "lucide-react";

interface TeachingCardsManagerProps {
  lesson: ProcessedLesson;
  selectedCards: LessonCard[];
  onSave: (cards: LessonCard[]) => void;
}

export function TeachingCardsManager({
  lesson,
  selectedCards,
  onSave,
}: TeachingCardsManagerProps) {
  // Use our custom hooks for state management
  const cardManager = useTeachingCardsManager(selectedCards, lesson, onSave);

  // Use our custom AI hook with the direct onSave callback
  const aiTools = useLessonCardAI(selectedCards, lesson, onSave);

  // Create card functions using the factory
  const createObjectiveCardHandler = () => {
    const newCard = createObjectiveCard(lesson, aiTools.successCriteria);
    onSave([...selectedCards, newCard]);
  };

  const createMaterialsCardHandler = () => {
    const newCard = createMaterialsCard(lesson);
    onSave([...selectedCards, newCard]);
  };

  const createTopicBackgroundCardHandler = () => {
    const newCard = createTopicBackgroundCard(lesson);
    onSave([...selectedCards, newCard]);
  };

  const createSectionCardsHandler = () => {
    const newCards = lesson.sections.flatMap((section) => {
      const sectionCard = createSectionCard(section, lesson);
      const activityCards =
        section.activities?.map((activity, index) =>
          createActivityCard(activity, index, section.id, section.title)
        ) || [];
      return [sectionCard, ...activityCards];
    });
    onSave([...selectedCards, ...newCards]);
  };

  // Prepare activities for bulk expander
  const sectionsWithActivities = lesson.sections
    .map((section, index) => ({
      section: section.title,
      sectionIndex: index,
      activities: section.activities || [],
    }))
    .filter((section) => section.activities.length > 0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="create" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Create</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>AI Tools</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span>Options</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Add Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <CardCreationToolbar
                lesson={lesson}
                successCriteria={aiTools.successCriteria}
                criteriaMessage={aiTools.criteriaMessage?.text || ""}
                intentionsMessage={aiTools.intentionsMessage?.text || ""}
                generatingCriteria={aiTools.generatingCriteria}
                improvingIntentions={aiTools.improvingIntentions}
                processingAllCards={aiTools.processingAllCards}
                onCreateObjectiveCard={createObjectiveCardHandler}
                onCreateMaterialsCard={createMaterialsCardHandler}
                onCreateTopicBackgroundCard={createTopicBackgroundCardHandler}
                onCreateSectionCards={createSectionCardsHandler}
                onAddCustomCard={cardManager.handleAddCustomCard}
                onGenerateSuccessCriteria={aiTools.handleGenerateSuccessCriteria}
                onImproveLearningIntentions={aiTools.handleImproveLearningIntentions}
                onMakeAllStudentFriendly={aiTools.makeAllCardsStudentFriendly}
                onCreateDifferentiatedCards={aiTools.createDifferentiatedCards}
                onToggleDifferentiatedSelector={() => 
                  cardManager.setShowDifferentiatedSelector(true)
                }
                onExpandActivities={() => 
                  cardManager.setShowActivityExpander(true)
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand className="h-4 w-4 text-accent" />
                AI Enhancement Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Success Criteria Generation */}
                <div className="space-y-2">
                  <Button
                    onClick={aiTools.handleGenerateSuccessCriteria}
                    disabled={aiTools.generatingCriteria}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-success text-success hover:bg-success/10"
                  >
                    {aiTools.generatingCriteria ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckSquare className="h-4 w-4" />
                    )}
                    {aiTools.generatingCriteria
                      ? "Generating..."
                      : "Generate Success Criteria"}
                  </Button>

                  {aiTools.criteriaMessage && (
                    <p className="text-sm text-muted-foreground bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-soft">
                      {aiTools.criteriaMessage.text}
                    </p>
                  )}
                </div>

                {/* Learning Intentions Improvement */}
                <div className="space-y-2">
                  <Button
                    onClick={aiTools.handleImproveLearningIntentions}
                    disabled={aiTools.improvingIntentions}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-secondary text-secondary hover:bg-secondary/10"
                  >
                    {aiTools.improvingIntentions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PencilRuler className="h-4 w-4" />
                    )}
                    {aiTools.improvingIntentions
                      ? "Improving..."
                      : "Improve Learning Intentions"}
                  </Button>

                  {aiTools.intentionsMessage && (
                    <p className="text-sm text-muted-foreground bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-soft">
                      {aiTools.intentionsMessage.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Bulk AI Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-muted">
                <Button
                  onClick={aiTools.makeAllCardsStudentFriendly}
                  disabled={aiTools.processingAllCards}
                  variant="outline"
                  className="flex items-center gap-2 border-accent/30 text-accent hover:bg-accent/10"
                >
                  {aiTools.processingAllCards ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {aiTools.processingAllCards ? "Processing..." : "Make All Student-Friendly"}
                </Button>

                <Button
                  onClick={aiTools.createDifferentiatedCards}
                  variant="outline"
                  className="flex items-center gap-2 border-info/30 text-info hover:bg-info/10"
                >
                  <Users className="h-4 w-4" />
                  Create Differentiated Cards
                </Button>

                <Button
                  onClick={() => cardManager.setShowActivityExpander(true)}
                  variant="outline" 
                  className="flex items-center gap-2 border-sea-green/30 text-sea-green hover:bg-sea-green/10"
                >
                  <Wand className="h-4 w-4" />
                  Expand Activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Presentation Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => cardManager.setShowDifferentiatedSelector(
                  !cardManager.showDifferentiatedSelector
                )}
                variant="outline"
                className="flex items-center gap-2 w-full"
              >
                <Users className="h-4 w-4" />
                Select Cards for Differentiation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cards Container */}
      <div className="max-h-[calc(100vh-25rem)] overflow-y-auto pr-2">
        <CardsContainer
          cards={selectedCards}
          editingCardId={cardManager.editingCardId}
          editTitle={cardManager.editTitle}
          editContent={cardManager.editContent}
          editDuration={cardManager.editDuration}
          processingCardId={aiTools.processingCardId}
          differentiatingCardId={aiTools.differentiatingCardId}
          onDragEnd={cardManager.handleDragEnd}
          onEdit={cardManager.handleEditCard}
          onSave={cardManager.handleSaveEdit}
          onCancel={cardManager.handleCancelEdit}
          onRemove={cardManager.handleRemoveCard}
          onToggleMode={cardManager.toggleCardMode}
          onToggleDifferentiated={cardManager.toggleDifferentiated}
          onMakeStudentFriendly={aiTools.makeCardStudentFriendly}
          onCreateDifferentiated={aiTools.createDifferentiatedCard}
          onAddAttachment={cardManager.handleAddAttachment}
          onDeleteAttachment={cardManager.handleDeleteAttachment}
          onTitleChange={cardManager.setEditTitle}
          onContentChange={cardManager.setEditContent}
          onDurationChange={cardManager.setEditDuration}
        />
      </div>

      {/* Modals */}
      {cardManager.showUploadModal && (
        <FileUploadModal
          isOpen={cardManager.showUploadModal}
          onClose={() => cardManager.setShowUploadModal(false)}
          onAttachmentAdded={cardManager.handleAttachmentAdded}
        />
      )}

      {cardManager.showDifferentiatedSelector && (
        <DifferentiatedCardsSelector
          cards={selectedCards}
          lesson={lesson}
          onApply={(updatedCards) => {
            onSave(updatedCards);
            cardManager.setShowDifferentiatedSelector(false);
          }}
          onCancel={() => cardManager.setShowDifferentiatedSelector(false)}
        />
      )}
      
      {cardManager.showActivityExpander && (
        <ActivityBulkExpander
          activities={sectionsWithActivities}
          lessonTitle={lesson.title}
          lessonLevel={lesson.level}
          onClose={() => cardManager.setShowActivityExpander(false)}
          onSaveExpanded={cardManager.handleSaveExpandedActivities}
        />
      )}
    </div>
  );
}