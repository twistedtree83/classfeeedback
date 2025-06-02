import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeySquare, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export const UpdatePasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verify we have a valid user session
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        setError(error);
      } else {
        setSuccessMessage('Password has been updated successfully');
        toast({
          title: "Success",
          description: "Password has been updated successfully",
        });
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
      <div className="text-center">
        <KeySquare className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-3xl font-bold text-foreground">Update your password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please enter your new password below
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md space-y-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5 text-muted-foreground" />}
            placeholder="••••••••"
            required
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="h-5 w-5 text-muted-foreground" />}
            placeholder="••••••••"
            required
          />
        </div>
        
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="p-3 rounded-md bg-green-50 text-green-700 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}
        
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || !!successMessage}
          isLoading={isSubmitting}
        >
          Update password
        </Button>
      </form>
    </div>
  );
};