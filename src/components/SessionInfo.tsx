import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, LogOut } from 'lucide-react';
import { endSession } from '../lib/supabaseClient';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui-shadcn/card';
import { useToast } from '@/components/ui/use-toast';

interface SessionInfoProps {
  sessionCode: string;
  teacherName: string;
  onEndSession: () => void;
}

export function SessionInfo({ sessionCode, teacherName, onEndSession }: SessionInfoProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = async () => {
    if (window.confirm('Are you sure you want to end this session? Students will no longer be able to submit feedback.')) {
      const success = await endSession(sessionCode);
      if (success) {
        toast({
          title: "Session ended",
          description: "The classroom session has been ended",
        });
        onEndSession();
      } else {
        toast({
          title: "Error",
          description: "Failed to end session",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-2xl">Current Session</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleEndSession}
          className="text-red-500 hover:bg-red-50 border-red-200 flex items-center gap-1"
        >
          <LogOut size={16} />
          <span>End Session</span>
        </Button>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Teacher</p>
            <p className="font-semibold">{teacherName}</p>
          </div>
          
          <div className="md:ml-auto">
            <p className="text-sm font-medium text-muted-foreground">Class Code</p>
            <div className="flex items-center mt-1">
              <div className="bg-primary/10 text-primary font-mono text-xl px-4 py-1 rounded-lg tracking-widest">
                {sessionCode}
              </div>
              <button
                onClick={copyCodeToClipboard}
                className="ml-2 p-1 hover:bg-accent rounded-md transition-colors"
                title="Copy code"
              >
                <ClipboardCopy size={20} />
              </button>
              {copied && (
                <span className="ml-2 text-sm text-green-600 animate-fade-in">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}