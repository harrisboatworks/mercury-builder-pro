import { motion } from 'framer-motion';
import { Info, Check } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { MotorOption } from '@/hooks/useMotorOptions';

interface VisualOptionCardProps {
  option: MotorOption;
  isSelected: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  isRecommended?: boolean;
  disabled?: boolean;
}

export function VisualOptionCard({
  option,
  isSelected,
  onToggle,
  onViewDetails,
  isRecommended = false,
  disabled = false,
}: VisualOptionCardProps) {
  const { triggerHaptic } = useHapticFeedback();
  const effectivePrice = option.is_included ? 0 : (option.price_override ?? option.base_price);

  const handleSelect = () => {
    if (disabled) return;
    triggerHaptic('addedToQuote');
    onToggle();
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onViewDetails();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSelect}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
          : 'border border-border hover:border-primary/30 hover:shadow-md'
        }
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {/* Image Container */}
      <div className="relative">
        <AspectRatio ratio={4 / 3}>
          <img 
            src={option.image_url || '/placeholder.svg'} 
            alt={option.name}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            className="w-full h-full object-cover bg-muted"
            loading="lazy"
          />
        </AspectRatio>
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-primary text-primary-foreground text-xs font-medium shadow-lg">
              Recommended
            </Badge>
          </div>
        )}
        
        {/* Price Badge */}
        <div className={`absolute top-2 right-2 z-10 px-2.5 py-1 rounded-lg text-sm font-semibold shadow-lg ${
          option.is_included 
            ? 'bg-green-500 text-white' 
            : 'bg-background text-foreground border border-border'
        }`}>
          {option.is_included ? 'Included' : `$${effectivePrice.toFixed(0)}`}
        </div>
        
        {/* Selection Checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute bottom-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-2 shadow-lg"
          >
            <Check className="w-4 h-4" />
          </motion.div>
        )}

        {/* Info Button */}
        <button
          onClick={handleInfoClick}
          className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-sm text-foreground rounded-full p-2 shadow-lg hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="View details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      
      {/* Card Content */}
      <div className="p-3 bg-card">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {option.name}
        </h3>
        {option.short_description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {option.short_description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
