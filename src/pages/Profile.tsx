import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export function Profile() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      setTitle(user.user_metadata?.title || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          title: title
        }
      });
      
      if (error) {
        throw error;
      }
      
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = () => {
    navigate('/update-password');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    } else {
      setError(error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-12 w-12 text-indigo-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Profile Settings
            </h1>
            
            {error && (
              <div className="p-3 mb-4 rounded-md bg-red-50 text-red-700 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 mb-4 rounded-md bg-green-50 text-green-700 flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <select
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="h-5 w-5 text-gray-400" />}
                placeholder="Enter your name"
              />
              
              <Input
                label="Email"
                value={email}
                disabled
                icon={<Mail className="h-5 w-5 text-gray-400" />}
                className="bg-gray-50"
              />
              
              <div className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  isLoading={isUpdating}
                  className="w-full"
                >
                  Save Changes
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChangePassword}
                  className="w-full flex items-center justify-center"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Profile;