import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, LogIn, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    } else {
      console.error('Error signing out:', error);
    }
    setUserMenuOpen(false);
  };
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Classroom Feedback</h1>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
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
            
            {user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-1 text-gray-700 hover:text-indigo-600"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">
                    {user.user_metadata?.full_name || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Profile Settings
                        </div>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            )}
          </nav>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3 pb-3">
              <Link
                to="/"
                className={`block font-medium ${
                  location.pathname === '/' 
                    ? 'text-indigo-600' 
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/planner"
                className={`block font-medium ${
                  location.pathname.startsWith('/planner')
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Lesson Planner
              </Link>
              <Link
                to="/join"
                className={`block font-medium ${
                  location.pathname === '/join'
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Session
              </Link>
              
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block font-medium text-gray-500 hover:text-indigo-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center font-medium text-gray-500 hover:text-indigo-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block font-medium text-gray-500 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}