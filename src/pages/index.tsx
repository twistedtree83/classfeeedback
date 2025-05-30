import React, { useState } from 'react';
import { ClassCodeGenerator } from '../components/ClassCodeGenerator';
import { LiveFeedbackPanel } from '../components/LiveFeedbackPanel';
import { SessionInfo } from '../components/SessionInfo';
import { BookOpen } from 'lucide-react';

interface ActiveSession {
  code: string;
  teacherName: string;
}

export function TeacherDashboard() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  const handleCodeGenerated = (code: string) => {
    // In a real app, we would get the teacher's name from auth or form input
    const teacherName = 'Ms. Johnson';
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
            <span className="ml-auto text-sm text-gray-500">Teacher Dashboard</span>
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
                <div className="col-span-1 lg:col-span-2">
                  <LiveFeedbackPanel sessionCode={activeSession.code} />
                </div>
                
                {/* Could add more dashboard panels here in the future */}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                <h3 className="font-bold mb-2">Student Join Instructions</h3>
                <p>
                  Students can join this session by visiting the join page and entering the code: <strong>{activeSession.code}</strong>
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