import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeySquare, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export const ResetPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error);
      } else {
        setSuccessMessage('Password reset link has been sent to your email');
        toast({
          title: "Reset link sent",
          description: "Password reset link has been sent to your email",
        });
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
        <h2 className="mt-6 text-3xl font-bold text-foreground">Reset your password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll send you a link to reset your password
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5 text-muted-foreground" />}
            placeholder="you@example.com"
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
        
        <div className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !!successMessage}
            isLoading={isSubmitting}
          >
            Send reset link
          </Button>
          
          <Link to="/login" className="text-center text-sm text-primary hover:text-primary/90">
            Return to sign in
          </Link>
        </div>
      </form>
    </div>
  );
};