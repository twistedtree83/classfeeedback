import React from 'react';
import { BookOpen, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

export function Logo({ 
  size = 'md', 
  variant = 'full',
  className 
}: LogoProps) {
  // Size mappings for the logo
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };
  
  // Text size mappings
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative">
        <div className={cn("relative z-10", sizeClasses[size])}>
          <div className="absolute inset-0 bg-primary/20 rounded-lg transform rotate-45"></div>
          <BookOpen className={cn("text-primary relative z-20", sizeClasses[size])} />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-primary/10 rounded-full p-1">
          <MessageSquare className={`text-primary ${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
      </div>
      
      {variant === 'full' && (
        <div className={cn("font-bold ml-3 text-foreground", textSizes[size])}>
          Classroom <span className="text-primary">Feedback</span>
        </div>
      )}
    </div>
  );
}