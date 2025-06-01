import React from 'react';
import { formatTime } from '../lib/utils';
import { MessageSquare, X } from 'lucide-react';
import type { TeacherMessage } from '../lib/types';

interface MessagePanelProps {
  messages: TeacherMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export function MessagePanel({ messages, isOpen, onClose }: MessagePanelProps) {
  // Added debug logging
  console.log("MessagePanel render:", { isOpen, messagesCount: messages.length });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-y-0 right-0 w-80 bg-white shadow-lg z-50 overflow-hidden flex flex-col" 
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
          Teacher Messages ({messages.length})
        </h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Close messages panel"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-blue-800">{message.teacher_name}</span>
                  <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                </div>
                <p className="text-gray-800 break-words">{message.message_content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}