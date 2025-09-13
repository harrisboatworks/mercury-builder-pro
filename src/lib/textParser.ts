export interface ParsedSegment {
  type: 'text' | 'url' | 'phone' | 'sms' | 'email';
  content: string;
  href?: string;
}

export const parseMessageText = (text: string): ParsedSegment[] => {
  const segments: ParsedSegment[] = [];
  
  // Combined regex for URLs, emails, and phone numbers
  const combinedRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})|([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4}))/g;
  
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    const matchedText = match[0];
    
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
      if (cleanNumber.startsWith('647952') || text.toLowerCase().includes('text') || text.toLowerCase().includes('sms')) {
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
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
};