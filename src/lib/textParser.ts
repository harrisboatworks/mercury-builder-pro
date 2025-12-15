export interface ParsedSegment {
  type: 'text' | 'url' | 'phone' | 'sms' | 'email' | 'internal-link';
  content: string;
  href?: string;
}

// Check if a URL is internal (should use React Router navigation)
export const isInternalLink = (url: string): boolean => {
  return url.startsWith('/') || 
         url.includes('/quote/') || 
         url.includes('harrisboatworks.com') ||
         url.includes('harrisboatworks.ca');
};

// Extract path from URL for internal navigation
export const getInternalPath = (url: string): string => {
  if (url.startsWith('/')) return url;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
};

export const parseMessageText = (text: string): ParsedSegment[] => {
  const segments: ParsedSegment[] = [];
  
  // First, handle markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let processedText = text;
  const markdownLinks: { placeholder: string; content: string; href: string }[] = [];
  
  let match;
  let placeholderIndex = 0;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const placeholder = `__MDLINK_${placeholderIndex}__`;
    markdownLinks.push({
      placeholder,
      content: match[1],
      href: match[2]
    });
    processedText = processedText.replace(match[0], placeholder);
    placeholderIndex++;
  }
  
  // Combined regex for URLs, emails, and phone numbers
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})|([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4}))/g;
  
  let lastIndex = 0;
  let urlMatch;

  while ((urlMatch = combinedRegex.exec(processedText)) !== null) {
    // Add text before the match
    if (urlMatch.index > lastIndex) {
      segments.push({
        type: 'text',
        content: processedText.substring(lastIndex, urlMatch.index)
      });
    }

    const matchedText = urlMatch[0];
    
    // Determine the type of match
    if (matchedText.includes('@')) {
      // Email
      segments.push({
        type: 'email',
        content: matchedText,
        href: `mailto:${matchedText}`
      });
    } else if (matchedText.match(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)) {
      // Phone number - determine if it's SMS or voice based on context
      const cleanNumber = matchedText.replace(/[^\d]/g, '');
      const formattedNumber = `+1${cleanNumber}`;
      
      // Check if this looks like the SMS line (647-952-2153 pattern)
      if (cleanNumber.startsWith('647952') || processedText.toLowerCase().includes('text') || processedText.toLowerCase().includes('sms')) {
        segments.push({
          type: 'sms',
          content: matchedText,
          href: `sms:${formattedNumber}`
        });
      } else {
        segments.push({
          type: 'phone',
          content: matchedText,
          href: `tel:${formattedNumber}`
        });
      }
    } else {
      // URL
      let href = matchedText;
      if (!href.startsWith('http')) {
        href = `https://${href}`;
      }
      segments.push({
        type: 'url',
        content: matchedText,
        href
      });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < processedText.length) {
    segments.push({
      type: 'text',
      content: processedText.substring(lastIndex)
    });
  }

  // Now replace placeholders with actual markdown link segments
  const finalSegments: ParsedSegment[] = [];
  for (const segment of segments) {
    if (segment.type === 'text') {
      // Check if this text contains any markdown link placeholders
      let remainingText = segment.content;
      for (const link of markdownLinks) {
        if (remainingText.includes(link.placeholder)) {
          const parts = remainingText.split(link.placeholder);
          if (parts[0]) {
            finalSegments.push({ type: 'text', content: parts[0] });
          }
          // Add the link - mark as internal if it's a site link
          finalSegments.push({
            type: isInternalLink(link.href) ? 'internal-link' : 'url',
            content: link.content,
            href: link.href
          });
          remainingText = parts.slice(1).join(link.placeholder);
        }
      }
      if (remainingText) {
        finalSegments.push({ type: 'text', content: remainingText });
      }
    } else {
      finalSegments.push(segment);
    }
  }

  return finalSegments.length > 0 ? finalSegments : [{ type: 'text', content: text }];
};