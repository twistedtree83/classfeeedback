import React from 'react';
import { SignupForm } from '../components/auth/SignupForm';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoWrapper } from '@/components/LogoWrapper';

export function Signup() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 flex items-center justify-center">
          <LogoWrapper size="lg" />
        </div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

export default Signup;