import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-repower-cream border border-repower-navy-900/10 px-3 py-2 rounded-2xl max-w-xs">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-repower-navy-900/40 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-repower-navy-900/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-repower-navy-900/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};