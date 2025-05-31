import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function Header() {
  const location = useLocation();
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Classroom Feedback</h1>
          </div>
          
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`font-medium ${
                location.pathname === '/' 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/planner"
              className={`font-medium ${
                location.pathname.startsWith('/planner')
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              Lesson Planner
            </Link>
            <Link
              to="/join"
              className={`font-medium ${
                location.pathname === '/join'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              Join Session
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}