import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";

export const SignupForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
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
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        setError(error);
      } else {
        setSuccessMessage('Registration successful! Please check your email for verification instructions.');
        toast({
          title: "Account created",
          description: "Registration successful! Please check your email for verification instructions.",
        });
        setTimeout(() => {
          navigate('/login');
        }, 5000);
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
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-3xl font-bold text-foreground">Create an account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/90">
            sign in to your existing account
          </Link>
        </p>
      </div>
      
      {successMessage ? (
        <div className="p-4 rounded-md bg-green-50 text-green-700 text-center">
          {successMessage}
          <p className="mt-2 text-sm">Redirecting you to the login page...</p>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="h-5 w-5 text-muted-foreground" />}
              placeholder="John Doe"
              required
            />
            
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
            
            <Input
              label="Confirm Password"
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
          
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Create account
          </Button>
        </form>
      )}
    </div>
  );
};