import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseMessageText, ParsedSegment, getInternalPath } from '@/lib/textParser';
import { useAIChat } from './GlobalAIChat';

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
  const navigate = useNavigate();
  const { closeChat, notifyChatMinimized } = useAIChat();

  const renderParsedText = (segments: ParsedSegment[]) => {
    return segments.map((segment, index) => {
      if (segment.type === 'text') {
        return <span key={index}>{segment.content}</span>;
      }
      
      // Render images
      if (segment.type === 'image') {
        return (
          <img
            key={index}
            src={segment.href}
            alt={segment.alt || 'Product image'}
            className="max-w-full rounded-lg my-2 border border-gray-200"
            style={{ maxHeight: '200px' }}
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        );
      }
      
      const linkClasses = `underline cursor-pointer ${
        message.isUser 
          ? 'text-red-100 hover:text-white' 
          : 'text-primary hover:text-primary/80'
      } transition-colors`;
      
      // For internal links, use React Router navigation (no new tab)
      if (segment.type === 'internal-link' && segment.href) {
        return (
          <button
            key={index}
            onClick={() => {
              closeChat();  // Minimize chat first
              notifyChatMinimized();  // Show notification in nudge bar
              navigate(getInternalPath(segment.href!));
            }}
            className={linkClasses}
          >
            {segment.content}
          </button>
        );
      }
      
      // For external URLs, open in new tab
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
          ? 'bg-red-600 text-white font-normal' 
          : 'bg-gray-50 text-gray-900 border border-gray-200 font-normal'
      }`}>
        <p className="text-sm whitespace-pre-wrap">
          {renderParsedText(parseMessageText(message.text))}
        </p>
      </div>
    </div>
  );
};