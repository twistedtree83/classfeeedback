import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRotatingFact } from '@/lib/educationalFacts';
import { BookOpen } from 'lucide-react';

interface WaitingRoomProps {
  studentName: string;
  avatarUrl?: string | null;
}

export function WaitingRoom({ studentName, avatarUrl }: WaitingRoomProps) {
  const fact = useRotatingFact();
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  
  const gradients = [
    'from-teal/30 via-orange/20 to-coral/30',
    'from-coral/30 via-teal/20 to-orange/30',
    'from-orange/30 via-coral/20 to-teal/30',
    'from-teal/20 via-orange/30 to-coral/20',
    'from-coral/20 via-teal/30 to-orange/20'
  ];
  
  // Change background color every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prevIndex) => (prevIndex + 1) % gradients.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradients[backgroundIndex]} transition-colors duration-5000 flex items-center justify-center p-4`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={studentName}
              className="h-32 w-32 mx-auto rounded-full object-cover border-4 border-teal/30"
            />
          ) : (
            <div className="h-32 w-32 mx-auto rounded-full bg-teal/20 flex items-center justify-center text-teal text-6xl font-bold">
              {studentName.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-teal mb-3"
        >
          Welcome, {studentName}!
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-600 mb-10"
        >
          Your teacher is preparing the lesson. Please wait...
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="p-6 bg-gradient-to-r from-teal/10 to-orange/10 rounded-xl mb-6"
        >
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-coral mr-3" />
            <h2 className="text-xl font-medium text-coral">Did You Know?</h2>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={fact.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.5 }}
              className="text-xl text-gray-800 leading-relaxed"
            >
              {fact.fact}
            </motion.p>
          </AnimatePresence>
          
          <motion.p 
            className="text-sm text-gray-500 mt-4 flex justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <span>Category: {fact.category}</span>
            <span>
              {fact.difficulty === 1 ? "Elementary" : 
               fact.difficulty === 2 ? "Middle School" : 
               "High School"}
            </span>
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 1, 0.5, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay: 0.7 }}
          className="text-teal/80 text-sm"
        >
          Waiting for your teacher to start the lesson...
        </motion.div>
      </motion.div>
    </div>
  );
}