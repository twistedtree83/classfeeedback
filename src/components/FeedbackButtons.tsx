import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { submitFeedback } from '../lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui-shadcn/card';

interface FeedbackButtonsProps {
  sessionCode: string;
  studentName: string;
}

interface FeedbackOption {
  value: string;
  label: string;
  color: string;
}

export function FeedbackButtons({ sessionCode, studentName }: FeedbackButtonsProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const { toast } = useToast();

  const feedbackOptions: FeedbackOption[] = [
    { value: '👍', label: 'I understand', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { value: '😕', label: 'I\'m confused', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
    { value: '❓', label: 'I have a question', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' }
  ];

  const handleSubmit = async () => {
    if (!selectedFeedback) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const result = await submitFeedback(sessionCode, studentName, selectedFeedback);
      if (result) {
        setMessage({ text: 'Feedback submitted successfully!', type: 'success' });
        toast({
          title: "Success",
          description: "Your feedback has been sent to the teacher",
        });
        // Reset selection after successful submission
        setSelectedFeedback(null);
      } else {
        setMessage({ text: 'Failed to submit feedback. Please try again.', type: 'error' });
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      
      // Clear success message after 3 seconds
      if (message?.type === 'success') {
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">How are you feeling?</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {feedbackOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFeedback(option.value)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                option.color,
                selectedFeedback === option.value 
                  ? "ring-2 ring-primary border-primary transform scale-105" 
                  : "hover:scale-105"
              )}
            >
              <span className="text-4xl mb-2">{option.value}</span>
              <span className="text-sm text-center font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {message && (
          <div 
            className={cn(
              "p-3 mb-4 rounded-lg text-center",
              message.type === 'success' ? "bg-green-100 text-green-800" : "bg-destructive/10 text-destructive"
            )}
          >
            {message.text}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!selectedFeedback || isSubmitting}
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Submit Feedback
        </Button>
      </CardFooter>
    </Card>
  );
}