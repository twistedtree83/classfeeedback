import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<boolean>;
  isSending: boolean;
}

export function SendMessageModal({ isOpen, onClose, onSendMessage, isSending }: SendMessageModalProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }
    setError(null);
    
    console.log("Sending message:", message);
    const success = await onSendMessage(message.trim());
    
    if (success) {
      console.log("Message sent successfully");
      toast({
        title: "Message sent",
        description: "Your message has been sent to all students",
      });
      setMessage('');
      onClose(); // Close modal on success
    } else {
      console.error("Failed to send message");
      setError('Failed to send message. Please try again.');
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Send Message to Students</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSending}>
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Your Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={isSending}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={4}
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSending || !message.trim()} isLoading={isSending}>
              Send Message
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}