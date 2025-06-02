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
 * Converts URLs in a string to HTML hyperlinks
 */
export function convertUrlsToHyperlinks(text: string): string {
  if (!text) return '';
  
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Replace URLs with hyperlinks
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${url}</a>`;
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
 * Sanitizes HTML content for safe display
 * This is a simple implementation - for production, consider using a dedicated library
 */
export function sanitizeHtml(content: string): string {
  if (!content) return '';
  
  // Process content with URLs and line breaks
  return processContentWithUrls(content);
}

/**
 * Groups feedback by type
 */
export function groupFeedbackByType(feedback: any[]): Record<string, any[]> {
  if (!feedback || !Array.isArray(feedback)) return {};
  
  return feedback.reduce((groups: Record<string, any[]>, item) => {
    const type = item.feedback_type || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {});
}