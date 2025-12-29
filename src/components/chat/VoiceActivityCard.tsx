import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { VoiceActivityEvent, VoiceActivityAction } from '@/lib/voiceActivityFeed';
import { 
  Search, Navigation, Check, Info, Tag, 
  DollarSign, Phone, Scale, Star, PartyPopper 
} from 'lucide-react';

interface VoiceActivityCardProps {
  activity: VoiceActivityEvent;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  '💰': <DollarSign className="w-4 h-4" />,
  '📞': <Phone className="w-4 h-4" />,
  '⚖️': <Scale className="w-4 h-4" />,
  '⭐': <Star className="w-4 h-4" />,
  '🎉': <PartyPopper className="w-4 h-4" />,
  '✅': <Check className="w-4 h-4" />,
};

const typeIconMap: Record<string, React.ReactNode> = {
  search: <Search className="w-4 h-4" />,
  navigate: <Navigation className="w-4 h-4" />,
  action: <Check className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  promo: <Tag className="w-4 h-4" />,
};

const typeBgMap: Record<string, string> = {
  search: 'bg-blue-500/10 border-blue-500/20',
  navigate: 'bg-purple-500/10 border-purple-500/20',
  action: 'bg-green-500/10 border-green-500/20',
  info: 'bg-amber-500/10 border-amber-500/20',
  promo: 'bg-pink-500/10 border-pink-500/20',
};

const typeIconBgMap: Record<string, string> = {
  search: 'bg-blue-500/20 text-blue-600',
  navigate: 'bg-purple-500/20 text-purple-600',
  action: 'bg-green-500/20 text-green-600',
  info: 'bg-amber-500/20 text-amber-600',
  promo: 'bg-pink-500/20 text-pink-600',
};

export const VoiceActivityCard: React.FC<VoiceActivityCardProps> = ({ 
  activity,
  className 
}) => {
  const navigate = useNavigate();
  const { dispatch } = useQuote();
  const { toast } = useToast();

  const handleAction = (action: VoiceActivityAction) => {
    // Handle navigation
    if (action.path) {
      navigate(action.path);
      return;
    }

    // Handle custom actions
    if (action.action === 'apply_trade_in' && action.actionData) {
      const data = action.actionData as {
        brand: string;
        year: number;
        horsepower: number;
        estimatedValue: number;
      };
      
      dispatch({
        type: 'SET_TRADE_IN_INFO',
        payload: {
          hasTradeIn: true,
          brand: data.brand,
          year: data.year,
          horsepower: data.horsepower,
          model: '',
          serialNumber: '',
          condition: 'good',
          estimatedValue: data.estimatedValue,
          confidenceLevel: 'medium',
        },
      });
      
      toast({
        title: 'Trade-in applied',
        description: `$${data.estimatedValue.toLocaleString()} added to your quote`,
      });
      return;
    }

    console.log('[VoiceActivityCard] Unknown action:', action);
  };

  const icon = activity.icon 
    ? iconMap[activity.icon] || typeIconMap[activity.type]
    : typeIconMap[activity.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-lg border p-3 shadow-sm',
        typeBgMap[activity.type] || 'bg-muted/50 border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className={cn(
          'p-1.5 rounded-md shrink-0',
          typeIconBgMap[activity.type] || 'bg-muted text-muted-foreground'
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {activity.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {activity.description}
          </p>
        </div>
      </div>

      {/* Actions */}
      {activity.actions && activity.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activity.actions.map((action, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              className="h-7 text-xs px-2.5"
              onClick={() => handleAction(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
