import React from 'react';
import { parseMessageText, ParsedSegment } from '@/lib/textParser';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderParsedText = (segments: ParsedSegment[]) => {
    return segments.map((segment, index) => {
      if (segment.type === 'text') {
        return <span key={index}>{segment.content}</span>;
      }
      
      const linkClasses = `underline ${
        message.isUser 
          ? 'text-red-100 hover:text-white' 
          : 'text-primary hover:text-primary/80'
      } transition-colors`;
      
      return (
        <a
          key={index}
          href={segment.href}
          className={linkClasses}
          target={segment.type === 'url' ? '_blank' : undefined}
          rel={segment.type === 'url' ? 'noopener noreferrer' : undefined}
        >
          {segment.content}
        </a>
      );
    });
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
        message.isUser 
          ? 'bg-red-600 text-white font-light' 
          : 'bg-gray-50 text-gray-900 border border-gray-200 font-light'
      }`}>
        <p className="text-sm whitespace-pre-wrap">
          {renderParsedText(parseMessageText(message.text))}
        </p>
      </div>
    </div>
  );
};