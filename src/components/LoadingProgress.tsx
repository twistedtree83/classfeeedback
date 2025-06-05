import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  progress: number; // 0-100
  step: string;
  isAnimating?: boolean;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  progress, 
  step, 
  isAnimating = true 
}) => {
  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        {isAnimating && <Loader2 className="h-5 w-5 text-teal animate-spin" />}
        <h3 className="font-semibold text-teal">{step}</h3>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-teal h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-right text-sm text-gray-500">
        {Math.round(progress)}% complete
      </div>
    </div>
  );
};