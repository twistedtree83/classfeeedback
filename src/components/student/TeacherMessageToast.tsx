import React, { useRef, useEffect } from "react";
import { Button } from "../ui/Button";
import { MessageSquare, X } from "lucide-react";
import type { TeacherMessage } from "../../lib/types";

interface TeacherMessageToastProps {
  message: TeacherMessage | null;
  onDismiss: () => void;
}

export function TeacherMessageToast({
  message,
  onDismiss,
}: TeacherMessageToastProps) {
  const messageToastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && messageToastRef.current) {
      messageToastRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={messageToastRef}
      className="fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-50 animate-slide-in-right"
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="h-5 w-5 text-blue-200 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-sm mb-1">Message from Teacher</div>
          <div className="text-sm opacity-90 line-clamp-3">
            {message.message_content}
          </div>
          <div className="text-xs opacity-75 mt-2">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="text-blue-200 hover:text-white hover:bg-blue-600 p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
