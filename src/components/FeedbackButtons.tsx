import React, { useState } from 'react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { submitFeedback } from '../lib/firebaseClient';

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
        // Reset selection after successful submission
        setSelectedFeedback(null);
      } else {
        setMessage({ text: 'Failed to submit feedback. Please try again.', type: 'error' });
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
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">How are you feeling?</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {feedbackOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedFeedback(option.value)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
              option.color,
              selectedFeedback === option.value 
                ? "ring-2 ring-indigo-500 border-indigo-500 transform scale-105" 
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
            message.type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}
        >
          {message.text}
        </div>
      )}
      
      <Button
        onClick={handleSubmit}
        disabled={!selectedFeedback || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </div>
  );
}