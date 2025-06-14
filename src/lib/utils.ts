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
export function groupFeedbackByType(feedback: Array<{ value?: string; feedback_type?: string }>) {
  const counts: Record<string, number> = {
    '👍': 0,
    '😕': 0,
    '❓': 0,
    'understand': 0,
    'confused': 0,
    'slower': 0
  };
  
  feedback.forEach(item => {
    // Handle old format
    if (item.value && counts[item.value] !== undefined) {
      counts[item.value]++;
    }
    
    // Handle new format
    if (item.feedback_type) {
      if (item.feedback_type === 'understand') counts['understand']++;
      if (item.feedback_type === 'confused') counts['confused']++; 
      if (item.feedback_type === 'slower') counts['slower']++;
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
export function sanitizeHtml(content: any): string {
  // Ensure content is a string
  if (!content) return '';
  
  // Convert content to string to handle non-string inputs
  const contentStr = String(content);
  
  // Step 1: Handle existing HTML links first (preserve them)
  const htmlLinkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
  const existingLinks: {full: string, href: string, text: string}[] = [];
  let contentWithPlaceholders = contentStr;
  
  // Extract and replace existing HTML links with placeholders
  let linkMatch;
  let linkCounter = 0;
  while ((linkMatch = htmlLinkRegex.exec(contentStr)) !== null) {
    const fullLink = linkMatch[0];
    const href = linkMatch[1];
    const text = linkMatch[2];
    
    existingLinks.push({full: fullLink, href, text});
    contentWithPlaceholders = contentWithPlaceholders.replace(
      fullLink, 
      `__LINK_PLACEHOLDER_${linkCounter++}__`
    );
  }
  
  // Step 2: Process markdown
  // Replace markdown headers
  let formatted = contentWithPlaceholders
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold my-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold my-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold my-4">$1</h1>');
  
  // Replace markdown bold, italic and other formatting
  formatted = formatted
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // Step 3: Process markdown lists
  // Convert list items, but filter out empty ones
  const lines = formatted.split(/\n/);
  let inList = false;
  let listItems: string[] = [];
  let listType = 'ul'; // default to unordered list
  
  const processedLines = lines.map(line => {
    // Check for markdown list indicators
    const trimmedLine = line.trim();
    
    // Unordered list items (-, *, •)
    const ulItemMatch = trimmedLine.match(/^[-*•]\s*(.*)/);
    
    // Ordered list items (1., 2., etc.)
    const olItemMatch = trimmedLine.match(/^(\d+)\.?\s+(.*)/);
    
    if (ulItemMatch) {
      const content = ulItemMatch[1].trim();
      if (content) {
        if (!inList) {
          inList = true;
          listType = 'ul';
          listItems = [`<li>${content}</li>`];
          return null; // Mark for later replacement
        } else if (listType === 'ul') {
          listItems.push(`<li>${content}</li>`);
          return null; // Mark for later replacement
        } else {
          // We were in an ordered list, finish it and start unordered
          const completedList = `<ol class="list-decimal pl-5 my-2">${listItems.join('')}</ol>`;
          listType = 'ul';
          listItems = [`<li>${content}</li>`];
          return completedList;
        }
      } else {
        // Skip empty list items
        return null;
      }
    } else if (olItemMatch) {
      const content = olItemMatch[2].trim();
      if (content) {
        if (!inList) {
          inList = true;
          listType = 'ol';
          listItems = [`<li>${content}</li>`];
          return null; // Mark for later replacement
        } else if (listType === 'ol') {
          listItems.push(`<li>${content}</li>`);
          return null; // Mark for later replacement
        } else {
          // We were in an unordered list, finish it and start ordered
          const completedList = `<ul class="list-disc pl-5 my-2">${listItems.join('')}</ul>`;
          listType = 'ol';
          listItems = [`<li>${content}</li>`];
          return completedList;
        }
      } else {
        // Skip empty list items
        return null;
      }
    } else if (inList) {
      // End of list
      inList = false;
      // Only return a list if there are actually items in it
      if (listItems.length > 0) {
        const listTag = listType === 'ul' ? 'ul class="list-disc pl-5 my-2"' : 'ol class="list-decimal pl-5 my-2"';
        return `<${listTag}>${listItems.join('')}</${listType}>${line}`;
      } else {
        return line;
      }
    }
    return line;
  }).filter(line => line !== null);
  
  // Handle case where list is at end of content
  if (inList && listItems.length > 0) {
    const listTag = listType === 'ul' ? 'ul class="list-disc pl-5 my-2"' : 'ol class="list-decimal pl-5 my-2"';
    processedLines.push(`<${listTag}>${listItems.join('')}</${listType}>`);
  }
  
  // Rejoin the processed lines
  formatted = processedLines.join('\n');
  
  // Step 4: Convert plain URLs to links
  formatted = convertUrlsToHyperlinks(formatted);
  
  // Step 5: Replace newlines with <br> tags
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Step 6: Restore original HTML links
  existingLinks.forEach((link, i) => {
    formatted = formatted.replace(`__LINK_PLACEHOLDER_${i}__`, link.full);
  });
  
  // Step 7: Clean up any dangling empty list items
  formatted = formatted
    .replace(/<li>\s*<\/li>/g, '') // Remove empty list items
    .replace(/<ul class="list-disc pl-5 my-2">\s*<\/ul>/g, '') // Remove empty lists
    .replace(/<ol class="list-decimal pl-5 my-2">\s*<\/ol>/g, ''); // Remove empty ordered lists
  
  // Step 8: Remove potentially dangerous tags and attributes
  return formatted
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/on\w+=\w+/g, '');
}