import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes without style conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a timestamp into a readable time
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generates a random name for anonymous students if needed
 */
export function generateRandomName(): string {
  const adjectives = [
    'Happy', 'Bright', 'Clever', 'Quick', 'Kind',
    'Brave', 'Swift', 'Wise', 'Calm', 'Noble'
  ];
  
  const nouns = [
    'Student', 'Scholar', 'Learner', 'Thinker', 'Mind',
    'Explorer', 'Achiever', 'Reader', 'Creator', 'Genius'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${randomAdjective}${randomNoun}`;
}

/**
 * Groups feedback by type
 */
export function groupFeedbackByType(feedback: Array<{ value: string }>) {
  const counts = {
    '👍': 0,
    '😕': 0,
    '❓': 0
  };
  
  feedback.forEach(item => {
    if (item.value in counts) {
      counts[item.value as keyof typeof counts]++;
    }
  });
  
  return counts;
}