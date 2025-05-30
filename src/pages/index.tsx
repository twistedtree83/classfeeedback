import React, { useState } from 'react';
import { ClassCodeGenerator } from '../components/ClassCodeGenerator';
import { LiveFeedbackPanel } from '../components/LiveFeedbackPanel';
import { SessionInfo } from '../components/SessionInfo';
import { ParticipantsList } from '../components/ParticipantsList';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActiveSession {
  code: string;
  teacherName: string;
}

export function TeacherDashboard() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  const handleCodeGenerated = (code: string) => {
    const teacherName = 'Ms. Johnson'; // In a real app, this would come from auth or form input
    setActiveSession({ code, teacherName });
  };

  const handleEndSession = () => {
    setActiveSession(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Classroom Feedback</h1>
            <div className="ml-auto flex items-center space-x-4">
              <Link to="/join" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Student View
              </Link>
              <span className="text-sm text-gray-500">Teacher Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {!activeSession ? (
            <div className="flex justify-center">
              <ClassCodeGenerator onCodeGenerated={handleCodeGenerated} />
            </div>
          ) : (
            <>
              <SessionInfo
                sessionCode={activeSession.code}
                teacherName={activeSession.teacherName}
                onEndSession={handleEndSession}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-1">
                  <LiveFeedbackPanel sessionCode={activeSession.code} />
                </div>
                <div className="lg:col-span-1">
                  <ParticipantsList sessionCode={activeSession.code} />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                <h3 className="font-bold mb-2">Student Join Instructions</h3>
                <p>
                  Students can join this session by visiting the{' '}
                  <Link to="/join" className="text-blue-600 hover:text-blue-800 underline">
                    join page
                  </Link>{' '}
                  and entering the code: <strong>{activeSession.code}</strong>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;