import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  GripVertical,
  Edit,
  Save,
  Sparkles,
  Split,
  UserCircle,
  Paperclip,
  Trash2,
  Users,
  Loader2,
  RefreshCw,
  BookText,
  Toggle
} from "lucide-react";
import { sanitizeHtml } from "../../lib/utils";
import { AttachmentDisplay } from "../AttachmentDisplay";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { LessonCard } from "../../lib/types";

interface TeachingCardProps {
  card: LessonCard;
  index: number;
  isEditing: boolean;
  editTitle: string;
  editContent: string;
  editDuration: string;
  processingCardId: string | null;
  differentiatingCardId: string | null;
  generatingRemedialId?: string | null;
  onEdit: (card: LessonCard) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onRemove: (id: string) => void;
  onToggleMode: (cardId: string) => void;
  onToggleDifferentiated: (cardId: string) => void;
  onToggleRemedial?: (cardId: string) => void;
  onMakeStudentFriendly: (cardId: string) => void;
  onCreateDifferentiated: (cardId: string) => void;
  onCreateRemedial?: (cardId: string) => void;
  onAddAttachment: (cardId: string) => void;
  onDeleteAttachment: (cardId: string, attachmentId: string) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onDurationChange: (duration: string) => void;
}

export function TeachingCard({
  card,
  index,
  isEditing,
  editTitle,
  editContent,
  editDuration,
  processingCardId,
  differentiatingCardId,
  generatingRemedialId,
  onEdit,
  onSave,
  onCancel,
  onRemove,
  onToggleMode,
  onToggleDifferentiated,
  onToggleRemedial,
  onMakeStudentFriendly,
  onCreateDifferentiated,
  onCreateRemedial,
  onAddAttachment,
  onDeleteAttachment,
  onTitleChange,
  onContentChange,
  onDurationChange,
}: TeachingCardProps) {
  const getCardIcon = (type: string) => {
    switch (type) {
      case "objective":
        return "🎯";
      case "material":
        return "📚";
      case "section":
        return "📖";
      case "activity":
        return "🎲";
      case "topic_background":
        return "🧠";
      default:
        return "📄";
    }
  };

  const getCardVariant = (type: string) => {
    switch (type) {
      case "objective":
        return "border-blue-200 bg-blue-50";
      case "material":
        return "border-green-200 bg-green-50";
      case "section":
        return "border-purple-200 bg-purple-50";
      case "activity":
        return "border-orange-200 bg-orange-50";
      case "topic_background":
        return "border-indigo-200 bg-indigo-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const displayContent =
    card.isDifferentiated && card.differentiatedContent
      ? card.differentiatedContent
      : card.studentFriendly && card.originalContent
      ? card.content
      : card.content;

  // Enhanced content renderer with proper heading levels
  const renderContent = () => {
    if (isEditing) {
      return (
        <textarea
          value={editContent}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Card content..."
        />
      );
    }

    // For cards that might contain HTML, use sanitizeHtml
    return (
      <div
        className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-800 prose-h2:text-lg prose-h3:text-base prose-h4:text-sm prose-p:text-gray-700 prose-ul:text-gray-700"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(displayContent),
        }}
      />
    );
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-4 rounded-xl shadow-sm ${
            snapshot.isDragging ? "shadow-lg rotate-2" : ""
          } transition-all duration-200 overflow-hidden`}
        >
          <Card className={`${getCardVariant(card.type)}`}>
            <CardHeader className="p-3 flex flex-row items-start space-y-0 gap-3">
              {/* Drag Handle */}
              <div
                {...provided.dragHandleProps}
                className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                title="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Card Header Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCardIcon(card.type)}</span>
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="font-semibold text-base border-none bg-transparent p-0 h-7 focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                        placeholder="Card title"
                      />
                    ) : (
                      <h2 className="font-semibold text-lg text-gray-800 truncate">
                        {card.title}
                      </h2>
                    )}
                    {card.duration && !isEditing && (
                      <Badge variant="outline" className="text-xs bg-white">
                        {card.duration}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Student-friendly toggle */}
                    {card.originalContent && (
                      <Button
                        onClick={() => onToggleMode(card.id)}
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-auto rounded-full ${
                          card.studentFriendly
                            ? "bg-green-100 text-green-700"
                            : "text-gray-500"
                        }`}
                        title={
                          card.studentFriendly
                            ? "Show original"
                            : "Show student-friendly"
                        }
                      >
                        <UserCircle className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Differentiated toggle */}
                    {card.differentiatedContent && (
                      <Button
                        onClick={() => onToggleDifferentiated(card.id)}
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-auto rounded-full ${
                          card.isDifferentiated
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-500"
                        }`}
                        title={
                          card.isDifferentiated
                            ? "Show original"
                            : "Show differentiated"
                        }
                      >
                        <Split className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Remedial toggle */}
                    {card.remedialActivity && onToggleRemedial && (
                      <Button
                        onClick={() => onToggleRemedial(card.id)}
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-auto rounded-full ${
                          card.isRemedialEnabled
                            ? "bg-purple-100 text-purple-700"
                            : "text-gray-500"
                        }`}
                        title={
                          card.isRemedialEnabled
                            ? "Disable remedial version"
                            : "Enable remedial version"
                        }
                      >
                        <Toggle className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Make student-friendly */}
                    {!card.originalContent && (
                      <Button
                        onClick={() => onMakeStudentFriendly(card.id)}
                        disabled={processingCardId === card.id}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto rounded-full text-gray-500 hover:text-green-600"
                        title="Make student-friendly"
                      >
                        {processingCardId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Create differentiated */}
                    {!card.differentiatedContent && (
                      <Button
                        onClick={() => onCreateDifferentiated(card.id)}
                        disabled={differentiatingCardId === card.id}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto rounded-full text-gray-500 hover:text-blue-600"
                        title="Create differentiated version"
                      >
                        {differentiatingCardId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Create remedial version */}
                    {!card.remedialActivity && onCreateRemedial && (
                      <Button
                        onClick={() => onCreateRemedial(card.id)}
                        disabled={generatingRemedialId === card.id}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto rounded-full text-gray-500 hover:text-purple-600"
                        title="Create simplified version for remedial support"
                      >
                        {generatingRemedialId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BookText className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Attachment button */}
                    <Button
                      onClick={() => onAddAttachment(card.id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto rounded-full text-gray-500 hover:text-purple-600"
                      title="Add attachment"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    {/* Edit/Save button */}
                    {isEditing ? (
                      <Button
                        onClick={() => onSave(card.id)}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto rounded-full text-green-600 hover:text-green-700"
                        title="Save changes"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onEdit(card)}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto rounded-full text-gray-500 hover:text-blue-600"
                        title="Edit card"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Remove button */}
                    <Button
                      onClick={() => onRemove(card.id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto rounded-full text-gray-500 hover:text-red-600"
                      title="Remove card"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Duration Input (when editing) */}
                {isEditing && (
                  <div className="mt-2">
                    <Input
                      value={editDuration}
                      onChange={(e) => onDurationChange(e.target.value)}
                      placeholder="Duration (optional)"
                      className="text-sm h-8"
                    />
                  </div>
                )}
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-3">
              {/* Card Content */}
              {renderContent()}

              {/* Content Type Indicators */}
              {(card.studentFriendly && card.originalContent) || 
               (card.isDifferentiated && card.differentiatedContent) ||
               (card.isRemedialEnabled && card.remedialActivity) ? (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {card.studentFriendly && card.originalContent && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      Student-Friendly
                    </Badge>
                  )}
                  {card.isDifferentiated && card.differentiatedContent && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                      Differentiated
                    </Badge>
                  )}
                  {card.isRemedialEnabled && card.remedialActivity && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                      Remedial Support
                    </Badge>
                  )}
                </div>
              ) : null}
            </CardContent>

            {/* Attachments */}
            {card.attachments && card.attachments.length > 0 && (
              <div className="px-3 pb-3">
                <Separator className="mb-3" />
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </h4>
                <div className="space-y-2">
                  {card.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between"
                    >
                      <AttachmentDisplay attachment={attachment} />
                      <Button
                        onClick={() =>
                          onDeleteAttachment(card.id, attachment.id)
                        }
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel button when editing */}
            {isEditing && (
              <CardFooter className="flex justify-end pt-2 pb-3 px-3">
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
}