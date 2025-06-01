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

/**
 * Sanitizes HTML to prevent XSS attacks
 * Basic implementation - for production, use a library like DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes while preserving links
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/on\w+=\w+/g, '');
}

/**
 * Converts URLs in text content to clickable hyperlinks
 */
export function convertUrlsToHyperlinks(text: string): string {
  if (!text) return '';
  
  // Enhanced regex for URL detection that handles a wider variety of URL formats
  // This regex captures URLs starting with http://, https://, ftp://, or www.
  // It also handles URLs with query parameters, fragments, and various TLDs
  const urlRegex = /(\b(?:https?|ftp):\/\/|www\.)[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]\S*)?/gi;
  
  return text.replace(urlRegex, (url) => {
    // Add protocol if missing
    const href = url.startsWith('www.') ? `https://${url}` : url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline">${url}</a>`;
  });
}

/**
 * Processes text content to convert URLs to hyperlinks and ensures proper HTML
 */
export function processContentWithUrls(content: string): string {
  if (!content) return '';
  
  // First convert URLs to hyperlinks
  let processedContent = convertUrlsToHyperlinks(content);
  
  // Convert newlines to <br> tags for proper HTML rendering
  processedContent = processedContent.replace(/\n/g, '<br>');
  
  return processedContent;
}