import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get the location the user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error);
      } else {
        toast({
          title: "Success",
          description: "You've been logged in successfully",
        });
        // Redirect to the page they were trying to access
        navigate(from, { replace: true });
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
        <LogIn className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-3xl font-bold text-foreground">Sign in to your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-primary/90">
            create a new account
          </Link>
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5 text-muted-foreground" />}
            placeholder="you@example.com"
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/reset-password" className="font-medium text-primary hover:text-primary/90">
              Forgot your password?
            </Link>
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>
    </div>
  );
};