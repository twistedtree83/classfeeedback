import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JoinSessionForm } from '../components/JoinSessionForm';

export function JoinPage() {
  const navigate = useNavigate();

  // Instead of an automatic redirect, show the join form directly
  const handleJoinSession = (code: string, name: string, avatarUrl?: string) => {
    // Navigate to student view with code as URL parameter
    navigate(`/student?code=${code}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md mb-4 flex justify-start">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
              <ArrowLeft size={16} className="mr-1" />
              Back to Home
            </Link>
          </div>
          <JoinSessionForm onJoinSession={handleJoinSession} />
        </div>
      </main>
    </div>
  );
}

export default JoinPage;