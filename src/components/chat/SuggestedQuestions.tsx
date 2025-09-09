import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ 
  onQuestionSelect 
}) => {
  const questions = [
    "What Mercury motor is best for my pontoon boat?",
    "How much does a 150HP Mercury motor cost?",
    "What's included in motor installation?",
    "Can you help me build a quote?"
  ];

  return (
    <div className="px-4 pb-2">
      <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onQuestionSelect(question)}
            className="text-xs h-7 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
};