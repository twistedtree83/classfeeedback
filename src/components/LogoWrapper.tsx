import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { FallbackLogo } from './FallbackLogo';
import { cn } from '@/lib/utils';

interface LogoWrapperProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

export function LogoWrapper(props: LogoWrapperProps) {
  const [imageLoaded, setImageLoaded] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if the image exists
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = '/images/logo.png';
  }, []);
  
  if (imageLoaded === null) {
    // Initial loading state
    return <FallbackLogo {...props} />;
  }
  
  return imageLoaded ? <Logo {...props} /> : <FallbackLogo {...props} />;
}