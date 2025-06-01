import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function JoinPage() {
  const navigate = useNavigate();

  // Redirect to the new student view
  React.useEffect(() => {
    navigate('/student');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md mb-4 flex justify-start">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
              <ArrowLeft size={16} className="mr-1" />
              Back to Teacher View
            </Link>
          </div>
          <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JoinPage;