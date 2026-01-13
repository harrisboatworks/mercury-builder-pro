import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
  questions?: string[]; // Accept dynamic questions
}

const defaultQuestions = [
  "What Mercury motor is best for my pontoon boat?",
  "How much does a 150HP Mercury motor cost?",
  "What's included in motor installation?",
  "Can you help me build a quote?"
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ 
  onQuestionSelect,
  questions: customQuestions
}) => {
  const questions = customQuestions || defaultQuestions;

  return (
    <div className="px-4 pb-2">
      <p className="text-xs text-gray-500 font-normal mb-2">Quick questions:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onQuestionSelect(question)}
            className="text-xs h-8 px-3 font-normal text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 border-0 rounded-full"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
};
