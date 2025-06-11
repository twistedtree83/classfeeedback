import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
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
} from "lucide-react";
import { sanitizeHtml } from "../../lib/utils";
import { AttachmentDisplay } from "../AttachmentDisplay";
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
  onEdit: (card: LessonCard) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onRemove: (id: string) => void;
  onToggleMode: (cardId: string) => void;
  onToggleDifferentiated: (cardId: string) => void;
  onMakeStudentFriendly: (cardId: string) => void;
  onCreateDifferentiated: (cardId: string) => void;
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
  onEdit,
  onSave,
  onCancel,
  onRemove,
  onToggleMode,
  onToggleDifferentiated,
  onMakeStudentFriendly,
  onCreateDifferentiated,
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

  const getCardColor = (type: string) => {
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

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-4 p-4 border-2 rounded-xl ${getCardColor(card.type)} ${
            snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm"
          } transition-all duration-200`}
        >
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Card Content */}
            <div className="flex-1 min-w-0">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCardIcon(card.type)}</span>
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => onTitleChange(e.target.value)}
                      className="font-semibold text-lg border-none bg-transparent p-0 focus:ring-2 focus:ring-blue-500 rounded"
                      placeholder="Card title"
                    />
                  ) : (
                    <h3 className="font-semibold text-lg text-gray-800 truncate">
                      {card.title}
                    </h3>
                  )}
                  {card.duration && (
                    <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-md">
                      {card.duration}
                    </span>
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
                      className={`p-1 h-auto ${
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
                      className={`p-1 h-auto ${
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

                  {/* Make student-friendly */}
                  {!card.originalContent && (
                    <Button
                      onClick={() => onMakeStudentFriendly(card.id)}
                      disabled={processingCardId === card.id}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-gray-500 hover:text-green-600"
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
                      className="p-1 h-auto text-gray-500 hover:text-blue-600"
                      title="Create differentiated version"
                    >
                      {differentiatingCardId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Attachment button */}
                  <Button
                    onClick={() => onAddAttachment(card.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-500 hover:text-purple-600"
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
                      className="p-1 h-auto text-green-600 hover:text-green-700"
                      title="Save changes"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onEdit(card)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-gray-500 hover:text-blue-600"
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
                    className="p-1 h-auto text-gray-500 hover:text-red-600"
                    title="Remove card"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Duration Input (when editing) */}
              {isEditing && (
                <div className="mb-3">
                  <Input
                    value={editDuration}
                    onChange={(e) => onDurationChange(e.target.value)}
                    placeholder="Duration (optional)"
                    className="text-sm"
                  />
                </div>
              )}

              {/* Card Content */}
              <div className="mb-3">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => onContentChange(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Card content..."
                  />
                ) : (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(displayContent),
                    }}
                  />
                )}
              </div>

              {/* Content Type Indicators */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                {card.studentFriendly && card.originalContent && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Student-Friendly
                  </span>
                )}
                {card.isDifferentiated && card.differentiatedContent && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Differentiated
                  </span>
                )}
              </div>

              {/* Attachments */}
              {card.attachments && card.attachments.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
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
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
