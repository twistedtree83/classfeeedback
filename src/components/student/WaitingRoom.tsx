import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRotatingFact } from '@/lib/educationalFacts';
import { BookOpen, ArrowRight } from 'lucide-react';

interface WaitingRoomProps {
  studentName: string;
  avatarUrl?: string | null;
  sessionCode?: string;
  teacherName?: string;
}

export function WaitingRoom({ 
  studentName, 
  avatarUrl,
  sessionCode = '',
  teacherName = 'your teacher'
}: WaitingRoomProps) {
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
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background layers */}
      {gradients.map((gradient, index) => (
        <motion.div
          key={index}
          className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
          initial={{ opacity: index === 0 ? 1 : 0 }}
          animate={{ 
            opacity: index === backgroundIndex ? 1 : 0 
          }}
          transition={{ 
            duration: 2,
            ease: "easeInOut"
          }}
        />
      ))}
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center z-10"
      >
        {sessionCode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4 bg-teal/10 inline-block px-3 py-1 rounded-full text-sm text-teal"
          >
            Session: {sessionCode}
          </motion.div>
        )}
        
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
          {teacherName} is preparing the lesson. Please wait...
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
          className="flex items-center justify-center gap-3 text-teal/80 text-sm"
        >
          <div className="flex items-center">
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.98, 1.02, 0.98]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-2 h-2 rounded-full bg-teal"
            />
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.98, 1.02, 0.98]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
              className="ml-1 w-2 h-2 rounded-full bg-teal"
            />
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.98, 1.02, 0.98]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6
              }}
              className="ml-1 w-2 h-2 rounded-full bg-teal"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="ml-2 flex items-center gap-2"
          >
            <span>
              Waiting for {teacherName} to start the lesson
            </span>
            <motion.div
              animate={{
                x: [0, 5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ArrowRight className="h-4 w-4 text-teal" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}