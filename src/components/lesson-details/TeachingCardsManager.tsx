// Import parts omitted for brevity - this file is large

export function TeachingCardsManager({
  lesson,
  selectedCards,
  onSave,
}: TeachingCardsManagerProps) {
  // Use our custom hooks for state management
  const cardManager = useTeachingCardsManager(selectedCards, lesson, onSave);

  // Use our custom AI hook with the direct onSave callback
  const aiTools = useLessonCardAI(selectedCards, lesson, onSave);

  // Handle adding a learning intention to the group card
  const addToLearningIntentions = (objective: string) => {
    const updatedCards = addToLearningIntentionsCard(selectedCards, objective);
    onSave(updatedCards);
  };

  // Handle adding a success criterion to the group card
  const addToSuccessCriteria = (criterion: string) => {
    const updatedCards = addToSuccessCriteriaCard(selectedCards, criterion);
    onSave(updatedCards);
  };

  // Handle adding a material to the group card
  const addToMaterialsCard = (material: string) => {
    // Find or create a materials card
    const materialsCardIndex = selectedCards.findIndex(
      card => card.type === "material" && card.title === "Required Materials"
    );

    if (materialsCardIndex >= 0) {
      // Add to existing card
      const updatedCards = [...selectedCards];
      const card = updatedCards[materialsCardIndex];
      
      // Check if this material is already in the card
      if (!card.content.includes(material)) {
        updatedCards[materialsCardIndex] = {
          ...card,
          content: card.content + `\n• ${material}`
        };
        onSave(updatedCards);
      }
    } else {
      // Create a new materials card with this item
      const newCard = {
        id: crypto.randomUUID(),
        type: "material",
        title: "Required Materials",
        content: `• ${material}`,
        duration: null,
        sectionId: null,
        activityIndex: null,
        attachments: []
      };
      onSave([...selectedCards, newCard]);
    }
  };

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

  // Prepare sections with activities for bulk expander
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
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="create" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Create</span>
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>Components</span>
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
        
        {/* Create Cards Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Add Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  onClick={createObjectiveCardHandler}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-dark-purple/30 text-dark-purple hover:bg-dark-purple/10"
                >
                  <Target className="h-6 w-6 text-dark-purple" />
                  <span className="text-sm font-medium">Learning Objectives</span>
                </Button>

                <Button
                  onClick={createMaterialsCardHandler}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-harvest-gold/30 text-harvest-gold hover:bg-harvest-gold/10"
                >
                  <BookOpen className="h-6 w-6 text-harvest-gold" />
                  <span className="text-sm font-medium">Materials</span>
                </Button>

                <Button
                  onClick={createTopicBackgroundCardHandler}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-bice-blue/30 text-bice-blue hover:bg-bice-blue/10"
                >
                  <Lightbulb className="h-6 w-6 text-bice-blue" />
                  <span className="text-sm font-medium">Topic Background</span>
                </Button>

                <Button
                  onClick={createSectionCardsHandler}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-deep-sky-blue/30 text-deep-sky-blue hover:bg-deep-sky-blue/10"
                >
                  <BookMarked className="h-6 w-6 text-deep-sky-blue" />
                  <span className="text-sm font-medium">All Sections</span>
                </Button>

                <Button
                  onClick={cardManager.handleAddCustomCard}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 text-center border-muted-foreground/30 text-muted-foreground hover:bg-muted/10"
                >
                  <FileEdit className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Custom Card</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Components Tab - NEW */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Individual Components
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Intentions Section */}
              <Accordion type="single" collapsible defaultValue="learning-intentions">
                <AccordionItem value="learning-intentions">
                  <AccordionTrigger className="py-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-dark-purple" />
                      <span className="font-medium">Learning Intentions</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {lesson.objectives.map((objective, index) => (
                        <div key={index} className="flex justify-between items-start p-2 bg-muted rounded-md hover:bg-muted/80 group">
                          <p className="text-sm flex-1 pr-2">{objective}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => addToLearningIntentions(objective)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => {
                          const content = lesson.objectives
                            .map((obj) => `• ${obj}`)
                            .join("\n");
                          onAddToTeaching("objective", {
                            title: "Learning Intentions",
                            content,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add All Intentions as One Card
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              
                {/* Success Criteria Section */}
                {lesson.success_criteria && lesson.success_criteria.length > 0 && (
                  <AccordionItem value="success-criteria">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-success" />
                        <span className="font-medium">Success Criteria</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {lesson.success_criteria.map((criterion, index) => (
                          <div key={index} className="flex justify-between items-start p-2 bg-success/5 rounded-md hover:bg-success/10 group">
                            <p className="text-sm flex-1 pr-2">{criterion}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => addToSuccessCriteria(criterion)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={() => {
                            const content = lesson.success_criteria
                              .map((sc) => `• ${sc}`)
                              .join("\n");
                            onAddToTeaching("objective", {
                              title: "Success Criteria",
                              content,
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add All Criteria as One Card
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {/* Materials Section */}
                <AccordionItem value="materials">
                  <AccordionTrigger className="py-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-harvest-gold" />
                      <span className="font-medium">Materials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {lesson.materials.map((material, index) => (
                        <div key={index} className="flex justify-between items-start p-2 bg-accent/5 rounded-md hover:bg-accent/10 group">
                          <p className="text-sm flex-1 pr-2">{material}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => addToMaterialsCard(material)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={createMaterialsCardHandler}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add All Materials as One Card
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Tools Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-accent" />
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
                      <ListChecks className="h-4 w-4" />
                    )}
                    Generate Success Criteria
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
                    Improve Learning Intentions
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