import { motion } from 'framer-motion';
import { CalendarOff, Percent, Banknote, type LucideIcon } from 'lucide-react';
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'relative bg-white border border-repower-navy-900/10 p-7 md:p-8 transition-colors duration-200 h-full flex flex-col',
        onClick && 'cursor-pointer hover:border-repower-navy-900',
        isSelected && 'border-repower-navy-900',
        className,
      )}
    >
      {/* Icon — monochrome, no colored circle */}
      <IconComponent className="w-6 h-6 text-repower-mercury-red mb-5" strokeWidth={1.75} />

      {/* Title */}
      <h3 className="font-display font-semibold text-[20px] text-repower-navy-900 mb-2 tracking-tight">
        {title}
      </h3>

      {/* Highlight value */}
      {highlight && (
        <p className="font-display font-bold text-[18px] text-repower-mercury-red mb-3 tracking-tight">
          {highlight}
        </p>
      )}

      {/* Description */}
      <p className="font-sans text-[14px] text-repower-navy-900/65 leading-relaxed mb-4">
        {description}
      </p>

      {/* Additional content */}
      <div className="mt-auto">{children}</div>
    </motion.div>
  );
}
