import React from 'react';
import { Button } from './ui/Button';
import { ClipboardCopy, LogOut } from 'lucide-react';
import { endSession } from '../lib/supabaseClient';

interface SessionInfoProps {
  sessionCode: string;
  teacherName: string;
  onEndSession: () => void;
}

export function SessionInfo({ sessionCode, teacherName, onEndSession }: SessionInfoProps) {
  const [copied, setCopied] = React.useState(false);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = async () => {
    if (window.confirm('Are you sure you want to end this session? Students will no longer be able to submit feedback.')) {
      const success = await endSession(sessionCode);
      if (success) {
        onEndSession();
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-teal/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-teal">Current Session</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleEndSession}
          className="text-red hover:bg-red/10 border-red/20 flex items-center gap-1"
        >
          <LogOut size={16} />
          <span>End Session</span>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Teacher</p>
          <p className="font-semibold text-gray-800">{teacherName}</p>
        </div>
        
        <div className="md:ml-auto">
          <p className="text-sm font-medium text-gray-500">Class Code</p>
          <div className="flex items-center mt-1">
            <div className="bg-teal/10 text-teal font-mono text-xl px-4 py-1 rounded-lg tracking-widest">
              {sessionCode}
            </div>
            <button
              onClick={copyCodeToClipboard}
              className="ml-2 p-1 hover:bg-teal/10 rounded-md transition-colors text-teal"
              title="Copy code"
            >
              <ClipboardCopy size={20} />
            </button>
            {copied && (
              <span className="ml-2 text-sm text-coral animate-fade-in">
                Copied!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}