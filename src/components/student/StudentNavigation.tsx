import React from "react";
import { Button } from "../ui/Button";
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  BookOpen,
  MessageSquareText,
  Bell,
} from "lucide-react";

interface StudentNavigationProps {
  currentCardIndex: number;
  totalCards: number;
  isFirstCard: boolean;
  isLastCard: boolean;
  sessionCode: string;
  newMessageCount: number;
  onToggleMessagePanel: () => void;
}

export function StudentNavigation({
  currentCardIndex,
  totalCards,
  isFirstCard,
  isLastCard,
  sessionCode,
  newMessageCount,
  onToggleMessagePanel,
}: StudentNavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Session Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-800">
              Session: {sessionCode}
            </span>
          </div>

          {/* Card Progress */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Card {currentCardIndex + 1} of {totalCards}
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentCardIndex + 1) / totalCards) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Messages Button */}
          <Button
            onClick={onToggleMessagePanel}
            variant="outline"
            size="sm"
            className="relative flex items-center gap-2"
          >
            <MessageSquareText className="h-4 w-4" />
            Messages
            {newMessageCount > 0 && (
              <>
                <Bell className="h-4 w-4 text-orange-500" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newMessageCount > 99 ? "99+" : newMessageCount}
                </span>
              </>
            )}
          </Button>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              disabled={isFirstCard}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ArrowLeftCircle className="h-4 w-4" />
              Previous
            </Button>

            <Button
              disabled={isLastCard}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              Next
              <ArrowRightCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
