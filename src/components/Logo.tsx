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

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src="/images/logo.png" 
        alt="Logo"
        className={cn("object-contain", sizeClasses[size])}
      />
    </div>
  );
}