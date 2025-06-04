import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  className?: string;
}

export function HeroCard({
  title = "Real-time classroom feedback and engagement",
  subtitle = "Interactive learning made simple",
  description = "Help students learn better with instant feedback, interactive lessons, and AI-powered teaching tools. Create meaningful classroom interactions that improve learning outcomes.",
  image = "https://images.pexels.com/photos/8471799/pexels-photo-8471799.jpeg?auto=compress&cs=tinysrgb&w=1600",
  imageAlt = "Classroom engagement",
  primaryButtonText = "Get Started",
  secondaryButtonText = "Join as Student",
  primaryButtonLink = "/signup",
  secondaryButtonLink = "/join",
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  className
}: HeroCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      return () => card.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const parallaxStyle = {
    transform: `translate(${(mousePosition.x - 0.5) * 15}px, ${(mousePosition.y - 0.5) * 15}px)`
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100",
        "max-w-6xl w-full mx-auto h-[80vh] min-h-[600px] max-h-[800px]",
        "transition-all duration-500 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
        {/* Background blobs */}
        <div 
          className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-100/50 filter blur-3xl"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * -20}px, ${(mousePosition.y - 0.5) * -20}px)`
          }}
        ></div>
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-100/50 filter blur-3xl"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 20}px, ${(mousePosition.y - 0.5) * 20}px)`
          }}
        ></div>
      </div>

      <div className="relative h-full flex flex-col lg:flex-row items-center">
        {/* Content Section */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-medium text-indigo-600 mb-3 tracking-wider uppercase"
          >
            {subtitle}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            {title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 mb-8 max-w-lg"
          >
            {description}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button 
              size="lg" 
              className="group"
              onClick={onPrimaryButtonClick}
              asChild={!!primaryButtonLink}
            >
              {primaryButtonLink ? (
                <a href={primaryButtonLink}>
                  {primaryButtonText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              ) : (
                <>
                  {primaryButtonText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={onSecondaryButtonClick}
              asChild={!!secondaryButtonLink}
            >
              {secondaryButtonLink ? (
                <a href={secondaryButtonLink}>
                  {secondaryButtonText}
                </a>
              ) : (
                secondaryButtonText
              )}
            </Button>
          </motion.div>
        </div>
        
        {/* Image Section */}
        <div className="w-full lg:w-1/2 h-full relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 1.1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-0 z-0"
            style={parallaxStyle}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent z-10"></div>
            <img 
              src={image} 
              alt={imageAlt}
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          {/* Floating cards */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute bottom-12 left-12 bg-white p-4 rounded-lg shadow-xl z-20 max-w-xs"
            style={{
              transform: `translate(${(mousePosition.x - 0.5) * -10}px, ${(mousePosition.y - 0.5) * -10}px)`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Live Feedback</p>
                <p className="text-sm text-gray-500">10 students participating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';