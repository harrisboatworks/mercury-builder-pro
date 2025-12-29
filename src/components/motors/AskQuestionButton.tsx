import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useQuote } from '@/contexts/QuoteContext';
import type { Motor as HelperMotor } from '@/lib/motor-helpers';
import type { Motor as QuoteMotor } from '@/components/QuoteBuilder';

interface AskQuestionButtonProps {
  motor: HelperMotor;
  className?: string;
  variant?: 'icon' | 'text';
}

export function AskQuestionButton({ motor, className = '', variant = 'icon' }: AskQuestionButtonProps) {
  const { openChat } = useAIChat();
  const { dispatch } = useQuote();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Convert the helper Motor to QuoteBuilder Motor format for context
    // Use model_display for specific variant info (e.g., "6 MLH FourStroke" includes shaft length, start type)
    const quoteMotor: QuoteMotor = {
      id: motor.id,
      model: motor.model_display || motor.model,
      year: motor.year || new Date().getFullYear(),
      hp: motor.hp,
      price: motor.price,
      image: motor.hero_image_url || motor.image_url || motor.images?.[0] || '',
      hero_image_url: motor.hero_image_url,
      image_url: motor.image_url,
      stockStatus: motor.in_stock ? 'In Stock' : (motor.availability === 'on_order' ? 'On Order' : 'Order Now'),
      stockNumber: motor.stock_number,
      model_number: motor.model_number,
      in_stock: motor.in_stock,
      stock_quantity: motor.stock_quantity,
      availability: motor.availability,
      category: motor.category || 'mid-range',
      type: motor.motor_type || 'Outboard',
      specs: motor.specifications ? JSON.stringify(motor.specifications) : '',
      hero_media_id: motor.hero_media_id,
      basePrice: motor.base_price,
      salePrice: motor.sale_price,
      msrp: motor.msrp,
      family: motor.family,
    };
    
    // Set this motor as the preview motor so the bar and chat have context
    dispatch({ 
      type: 'SET_PREVIEW_MOTOR', 
      payload: quoteMotor
    });
    
    // Open the chat - it will pick up the motor from previewMotor context
    openChat();
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md ${className}`}
        aria-label={`Ask a question about ${motor.model_display || motor.model}`}
      >
        <MessageCircle className="h-4 w-4" />
        Ask a Question
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 bg-white/90 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-gray-100 hover:shadow-md hover:shadow-primary/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${className}`}
          aria-label={`Ask a question about ${motor.model_display || motor.model}`}
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        <p>Ask about this motor</p>
      </TooltipContent>
    </Tooltip>
  );
}
