import React, { useEffect, useRef } from 'react';
import { formatTime } from '../lib/utils';
import { MessageSquare, X } from 'lucide-react';
import type { TeacherMessage } from '../lib/types';
import { Button } from '@/components/ui/button';

interface MessagePanelProps {
  messages: TeacherMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export function MessagePanel({ messages, isOpen, onClose }: MessagePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Debug logging to verify props
  useEffect(() => {
    console.log("MessagePanel mounted/updated:", { 
      isOpen, 
      messagesCount: messages.length, 
      messages: messages
    });
  }, [isOpen, messages]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      ref={panelRef}
      className="fixed inset-y-0 right-0 w-80 bg-card shadow-xl z-[9999] flex flex-col"
      style={{ boxShadow: "0 0 20px rgba(0, 0, 0, 0.2)" }}
    >
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
        <h2 className="text-lg font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-primary" />
          Teacher Messages ({messages.length})
        </h2>
        <Button 
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-muted"
          aria-label="Close messages panel"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 text-muted" />
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className="bg-card rounded-lg p-3 border border-blue-100 shadow-sm"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-primary">{message.teacher_name}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                </div>
                <p className="break-words">{message.message_content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}