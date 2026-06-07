import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MarkdownChatBody } from './MarkdownChatBody';
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

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
        message.isUser
          ? 'bg-red-600 text-white font-normal'
          : 'bg-gray-50 text-gray-900 border border-gray-200 font-normal'
      }`}>
        <MarkdownChatBody
          text={message.text}
          isUser={message.isUser}
          onInternalLink={(path) => {
            closeChat();
            notifyChatMinimized();
            navigate(path);
          }}
          className="text-sm"
        />
      </div>
    </div>
  );
};
