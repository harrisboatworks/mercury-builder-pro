import { motion } from 'framer-motion';
import { CalendarOff, Percent, Banknote, Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  'calendar-off': CalendarOff,
  'percent': Percent,
  'banknote': Banknote,
};

interface ChooseOneCardProps {
  id: string;
  title: string;
  description: string;
  icon?: string;
  highlight?: string;
  isSelected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function ChooseOneCard({
  id,
  title,
  description,
  icon = 'banknote',
  highlight,
  isSelected,
  onClick,
  children,
  className,
}: ChooseOneCardProps) {
  const IconComponent = iconMap[icon] || Banknote;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-xl border-2 p-6 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-lg',
        isSelected 
          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50',
        className
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <IconComponent className="w-7 h-7 text-primary" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      {/* Highlight badge */}
      {highlight && (
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
          {highlight}
        </span>
      )}

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        {description}
      </p>

      {/* Additional content (rates, matrix, etc.) */}
      {children}
    </motion.div>
  );
}
