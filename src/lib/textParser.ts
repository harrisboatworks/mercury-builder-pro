export interface ParsedSegment {
  type: 'text' | 'url' | 'phone' | 'sms' | 'email' | 'internal-link' | 'image';
  content: string;
  href?: string;
  alt?: string;
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
  
  // First, handle markdown images ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let processedText = text;
  const markdownImages: { placeholder: string; alt: string; src: string }[] = [];
  
  let match;
  let placeholderIndex = 0;
  while ((match = markdownImageRegex.exec(text)) !== null) {
    const placeholder = `__MDIMG_${placeholderIndex}__`;
    markdownImages.push({
      placeholder,
      alt: match[1],
      src: match[2]
    });
    processedText = processedText.replace(match[0], placeholder);
    placeholderIndex++;
  }
  
  // Then handle markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownLinks: { placeholder: string; content: string; href: string }[] = [];
  
  // Reset regex for links (use a fresh regex on processedText)
  let linkMatch;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((linkMatch = linkRegex.exec(processedText)) !== null) {
    const placeholder = `__MDLINK_${placeholderIndex}__`;
    markdownLinks.push({
      placeholder,
      content: linkMatch[1],
      href: linkMatch[2]
    });
    processedText = processedText.replace(linkMatch[0], placeholder);
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

  // Now replace placeholders with actual markdown segments (images and links)
  const finalSegments: ParsedSegment[] = [];
  for (const segment of segments) {
    if (segment.type === 'text') {
      let remainingText = segment.content;
      
      // Process images first
      for (const image of markdownImages) {
        if (remainingText.includes(image.placeholder)) {
          const parts = remainingText.split(image.placeholder);
          if (parts[0]) {
            finalSegments.push({ type: 'text', content: parts[0] });
          }
          // Add the image
          finalSegments.push({
            type: 'image',
            content: image.src,
            href: image.src,
            alt: image.alt
          });
          remainingText = parts.slice(1).join(image.placeholder);
        }
      }
      
      // Then process links
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