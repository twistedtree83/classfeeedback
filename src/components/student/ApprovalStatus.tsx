import React from 'react';
import { AlertCircle, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ApprovalStatusProps {
  status: 'pending' | 'approved' | 'rejected' | null;
  checking: boolean;
  teacherName: string;
  error: string | null;
  onReset: () => void;
}

export function ApprovalStatus({
  status,
  checking,
  teacherName,
  error,
  onReset
}: ApprovalStatusProps) {
  if (status === 'pending') {
    return (
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
          <div className="flex justify-center mb-6">
            {checking ? (
              <Loader2 className="h-12 w-12 text-teal animate-spin" />
            ) : (
              <AlertCircle className="h-12 w-12 text-orange" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-teal mb-4">
            Waiting for Approval
          </h2>
          <p className="text-gray-600 mb-6">
            Your request to join this session is being reviewed by {teacherName || 'the teacher'}.
          </p>
          <div className="animate-pulse bg-orange/10 text-orange border border-orange/30 px-4 py-3 rounded-lg inline-block">
            Please wait while the teacher approves your name...
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
          <div className="flex justify-center mb-6">
            <XCircle className="h-12 w-12 text-red" />
          </div>
          <h2 className="text-2xl font-bold text-red mb-4">
            Name Not Approved
          </h2>
          <p className="text-gray-600 mb-6">
            {teacherName || 'The teacher'} did not approve your name. This may be because it was inappropriate or didn't match classroom guidelines.
          </p>
          <Button
            onClick={onReset}
            className="w-full bg-teal hover:bg-teal/90 text-white"
            size="lg"
          >
            Try Again with a Different Name
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-teal/20">
          <div className="text-center">
            <div className="text-red mb-6">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Session Error</h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Button 
              onClick={onReset}
              className="bg-teal hover:bg-teal/90 text-white"
              size="lg"
            >
              Try Another Code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}