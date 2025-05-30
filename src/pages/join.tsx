import React, { useState } from 'react';
import { JoinSessionForm } from '../components/JoinSessionForm';
import { FeedbackButtons } from '../components/FeedbackButtons';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function JoinPage() {
  const [sessionInfo, setSessionInfo] = useState<{ code: string; studentName: string } | null>(null);

  const handleJoinSession = (code: string, studentName: string) => {
    setSessionInfo({ code, studentName });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Classroom Feedback</h1>
            <div className="ml-auto flex items-center space-x-4">
              <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Teacher View
              </Link>
              <span className="text-sm text-gray-500">Student View</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          {!sessionInfo ? (
            <>
              <div className="w-full max-w-md mb-4 flex justify-start">
                <Link to="/\" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                  <ArrowLeft size={16} className="mr-1" />
                  Back to Teacher View
                </Link>
              </div>
              <JoinSessionForm onJoinSession={handleJoinSession} />
            </>
          ) : (
            <>
              <div className="w-full max-w-md mb-8 bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Joined as</div>
                  <div className="font-medium">{sessionInfo.studentName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Class Code</div>
                  <div className="font-mono font-medium">{sessionInfo.code}</div>
                </div>
              </div>
              
              <FeedbackButtons 
                sessionCode={sessionInfo.code} 
                studentName={sessionInfo.studentName}
              />
              
              <p className="mt-8 text-center text-gray-500">
                Your feedback is sent anonymously to the teacher in real-time.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default JoinPage;