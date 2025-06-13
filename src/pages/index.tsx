import React, { useState, useEffect } from "react";
import { ClassCodeGenerator } from "../components/ClassCodeGenerator";
import { LiveFeedbackPanel } from "../components/LiveFeedbackPanel";
import { SessionInfo } from "../components/SessionInfo";
import { ParticipantsList } from "../components/ParticipantsList";
import { BookOpen, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { getPendingParticipantsForSession } from "../lib/supabaseClient";

interface ActiveSession {
  code: string;
  teacherName: string;
}

export function TeacherDashboard() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [pendingCount, setPendingCount] = useState(0);

  const handleCodeGenerated = (code: string) => {
    const teacherName = "Ms. Johnson"; // In a real app, this would come from auth or form input
    setActiveSession({ code, teacherName });
  };

  const handleEndSession = () => {
    setActiveSession(null);
    setPendingCount(0);
  };

  // Poll for pending participants
  useEffect(() => {
    if (!activeSession) return;

    const checkPendingParticipants = async () => {
      try {
        const pendingParticipants = await getPendingParticipantsForSession(
          activeSession.code
        );
        setPendingCount(pendingParticipants.length);
      } catch (err) {
        console.error("Error checking pending participants:", err);
      }
    };

    // Initial check
    checkPendingParticipants();

    // Set up polling every 5 seconds
    const interval = setInterval(checkPendingParticipants, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [activeSession]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5">
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
                  <div className="relative">
                    <ParticipantsList sessionCode={activeSession.code} />
                    {pendingCount > 0 && (
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-deep-sky-blue text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                        {pendingCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modern-card p-4 bg-gradient-to-br from-harvest-gold/10 to-harvest-gold/5 border border-harvest-gold/30 text-dark-purple">
                <h3 className="font-bold mb-2 text-dark-purple">
                  Student Join Instructions
                </h3>
                <p>
                  Students can join this session by visiting the{" "}
                  <Link
                    to="/join"
                    className="text-brand-primary hover:text-dark-purple-400 underline transition-colors"
                  >
                    join page
                  </Link>{" "}
                  and entering the code:{" "}
                  <strong className="text-brand-primary">
                    {activeSession.code}
                  </strong>
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
