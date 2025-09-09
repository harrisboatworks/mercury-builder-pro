import React from 'react';

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

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
        message.isUser 
          ? 'bg-red-600 text-white' 
          : 'bg-gray-100 text-gray-900 border'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={`text-xs mt-1 ${
          message.isUser ? 'text-red-100' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};