import React from 'react';
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
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };
  
  // Text size mappings
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src="/images/logo.png" 
        alt="Classroom Feedback Logo"
        className={cn("object-contain", sizeClasses[size])}
      />
      
      {variant === 'full' && (
        <div className={cn("font-bold ml-3 text-foreground", textSizes[size])}>
          Classroom <span className="text-primary">Feedback</span>
        </div>
      )}
    </div>
  );
}