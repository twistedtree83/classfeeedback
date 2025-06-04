import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, HelpCircle, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StudentInteractionPanelProps {
  onSendFeedback: (type: string) => Promise<void>;
  onSendQuestion: (question: string) => Promise<boolean>;
  isSending: boolean;
  currentFeedback: string | null;
}

export function StudentInteractionPanel({
  onSendFeedback,
  onSendQuestion,
  isSending,
  currentFeedback
}: StudentInteractionPanelProps) {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [question, setQuestion] = useState('');
  
  const handleFeedback = async (type: string) => {
    if (isSending) return;
    await onSendFeedback(type);
  };
  
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isSending) return;
    
    const success = await onSendQuestion(question);
    
    if (success) {
      setQuestion('');
      setShowQuestionForm(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        How are you following along?
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Button
          onClick={() => handleFeedback('understand')}
          disabled={isSending}
          variant={currentFeedback === 'understand' ? 'primary' : 'outline'}
          className={`py-3 ${currentFeedback === 'understand' ? 'bg-green-600 hover:bg-green-700' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
        >
          <ThumbsUp className="h-5 w-5 mr-2" />
          I understand
        </Button>

        <Button
          onClick={() => handleFeedback('confused')}
          disabled={isSending}
          variant={currentFeedback === 'confused' ? 'primary' : 'outline'}
          className={`py-3 ${currentFeedback === 'confused' ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-700 border-yellow-200 hover:bg-yellow-50'}`}
        >
          <ThumbsDown className="h-5 w-5 mr-2" />
          I'm confused
        </Button>

        <Button
          onClick={() => handleFeedback('slower')}
          disabled={isSending}
          variant={currentFeedback === 'slower' ? 'primary' : 'outline'}
          className={`py-3 ${currentFeedback === 'slower' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-700 border-blue-200 hover:bg-blue-50'}`}
        >
          <Clock className="h-5 w-5 mr-2" />
          Slow down
        </Button>
      </div>

      {showQuestionForm ? (
        <form onSubmit={handleSubmitQuestion} className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Ask a question
          </h3>
          <div className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuestionForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!question.trim() || isSending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Question
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <Button
          onClick={() => setShowQuestionForm(true)}
          variant="outline"
          className="w-full mt-4"
        >
          <HelpCircle className="h-5 w-5 mr-2" />
          Ask a Question
        </Button>
      )}
    </div>
  );
}