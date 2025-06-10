import React, { useState } from "react";
import { CheckCircle, XCircle, Loader2, BookMarked } from "lucide-react";
import { Button } from "./ui/Button";
import { generateDifferentiatedContent } from "../lib/aiService";
import type { LessonCard } from "../lib/types";

interface DifferentiatedCardsSelectorProps {
  cards: LessonCard[];
  lesson: any;
  onApply: (updatedCards: LessonCard[]) => void;
  onCancel: () => void;
}

export function DifferentiatedCardsSelector({
  cards,
  lesson,
  onApply,
  onCancel,
}: DifferentiatedCardsSelectorProps) {
  // Cards that can be differentiated (don't already have differentiated content)
  const availableCards = cards.filter((card) => !card.differentiatedContent);

  const [selectedCards, setSelectedCards] = useState<boolean[]>(
    new Array(availableCards.length).fill(true) // Auto-select all available cards
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleCardSelection = (index: number) => {
    const newSelection = [...selectedCards];
    newSelection[index] = !newSelection[index];
    setSelectedCards(newSelection);
  };

  const handleGenerateDifferentiated = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      const cardsToProcess = availableCards.filter(
        (_, index) => selectedCards[index]
      );
      let updatedCards = [...cards];

      for (let i = 0; i < cardsToProcess.length; i++) {
        const card = cardsToProcess[i];
        const originalIndex = cards.findIndex((c) => c.id === card.id);

        // Update progress
        setProgress(Math.round(((i + 1) / cardsToProcess.length) * 100));

        // Use the student-friendly content as base if available, otherwise use original
        const contentToAdapt =
          card.studentFriendly && card.originalContent
            ? card.content
            : card.originalContent || card.content;

        // Generate differentiated content
        const differentiatedContent = await generateDifferentiatedContent(
          contentToAdapt,
          card.type,
          lesson.level
        );

        // Update the card
        updatedCards[originalIndex] = {
          ...card,
          differentiatedContent,
        };

        // Small delay to avoid rate limits
        if (i < cardsToProcess.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      onApply(updatedCards);
    } catch (error) {
      console.error("Error generating differentiated cards:", error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const selectedCount = selectedCards.filter(Boolean).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-purple-600" />
            Select Cards for Differentiation
          </h2>
          <p className="text-gray-600 mt-1">
            Choose which cards you'd like to create simplified versions for.
            This helps make content accessible to students who need additional
            support.
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {availableCards.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  All Set!
                </h3>
                <p className="text-green-700">
                  All your cards already have differentiated versions. Students
                  can toggle between standard and simplified views.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Cards available for differentiation ({availableCards.length}):
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedCards(
                        new Array(availableCards.length).fill(true)
                      )
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedCards(
                        new Array(availableCards.length).fill(false)
                      )
                    }
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {availableCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCards[index]
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-purple-300"
                  }`}
                  onClick={() => toggleCardSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCards[index]}
                      onChange={() => toggleCardSelection(index)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase font-medium">
                          {card.type}
                        </span>
                        <h4 className="font-medium text-gray-900">
                          {card.title}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {card.content.substring(0, 150)}
                        {card.content.length > 150 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          {isGenerating && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Generating differentiated content...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasSelection && !isGenerating && (
                <span className="text-purple-600">
                  {selectedCount} card{selectedCount !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isGenerating}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleGenerateDifferentiated}
                disabled={
                  !hasSelection || isGenerating || availableCards.length === 0
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookMarked className="h-4 w-4 mr-1" />
                    Generate Differentiated Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
