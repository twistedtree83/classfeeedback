import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string into a readable time format (HH:MM AM/PM)
 */
export function formatTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
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
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${url}</a>`;
  });
}

/**
 * Processes content with newlines and URLs
 */
export function processContentWithUrls(content: string): string {
  if (!content) return '';
  
  // First replace newlines with <br> tags
  const withLineBreaks = content.replace(/\n/g, '<br>');
  
  // Then convert URLs to hyperlinks
  return convertUrlsToHyperlinks(withLineBreaks);
}

/**
 * Sanitizes HTML content for safe display and renders markdown
 */
export function sanitizeHtml(content: string): string {
  if (!content) return '';
  
  // Replace markdown headers
  let formatted = content
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4">$1</h1>');
  
  // Replace markdown bold and italic
  formatted = formatted
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace markdown lists
  formatted = formatted
    .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\+ (.*$)/gim, '<li>$1</li>');
  
  // Wrap adjacent list items in ul tags
  const lines = formatted.split(/\n/);
  let inList = false;
  
  formatted = lines.map(line => {
    if (line.trim().startsWith('<li>')) {
      if (!inList) {
        inList = true;
        return '<ul class="list-disc pl-5 my-2">' + line;
      }
      return line;
    } else if (inList) {
      inList = false;
      return '</ul>' + line;
    }
    return line;
  }).join('\n');
  
  if (inList) {
    formatted += '</ul>';
  }
  
  // Process URLs and convert newlines
  formatted = processContentWithUrls(formatted);
  
  // Remove potentially dangerous tags while preserving links
  return formatted
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/on\w+=\w+/g, '');
}