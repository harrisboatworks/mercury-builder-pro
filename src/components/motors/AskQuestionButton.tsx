import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAIChat } from '@/components/chat/GlobalAIChat';

interface AskQuestionButtonProps {
  motorModel: string;
  hp: number | string;
  className?: string;
  variant?: 'icon' | 'text';
}

export function AskQuestionButton({ motorModel, hp, className = '', variant = 'icon' }: AskQuestionButtonProps) {
  const { openChat } = useAIChat();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Send only the context marker - chat will show motor-specific prompts
    // and display a "Viewing: XXhp Motor" banner
    const contextMarker = `__MOTOR_CONTEXT__:${hp}:${motorModel}`;
    openChat(contextMarker);
  };

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`text-muted-foreground hover:text-primary gap-1.5 ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
        Ask a Question
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className={`h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all ${className}`}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Ask about this motor</p>
      </TooltipContent>
    </Tooltip>
  );
}
