import React from 'react';
import { CheckCircle, ThumbsUp, AlertCircle, AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';
import { useMotorCompatibility, CompatibilityResult } from '@/hooks/useMotorCompatibility';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { cn } from '@/lib/utils';

interface Motor {
  model: string;
  hp?: number;
  horsepower?: number;
}

interface BoatInfo {
  type?: string;
  length?: string;
  maxHp?: string;
}

interface MotorCompatibilityBadgeProps {
  motor: Motor | null;
  boatInfo: BoatInfo | null;
  onAddBoatInfo?: () => void;
  className?: string;
}

const iconMap = {
  CheckCircle,
  ThumbsUp,
  AlertCircle,
  AlertTriangle,
  HelpCircle
};

const colorMap = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600'
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    icon: 'text-gray-500'
  }
};

export const MotorCompatibilityBadge: React.FC<MotorCompatibilityBadgeProps> = ({
  motor,
  boatInfo,
  onAddBoatInfo,
  className
}) => {
  const compatibility = useMotorCompatibility(motor, boatInfo);
  const { openChat } = useAIChat();

  const Icon = iconMap[compatibility.icon];
  const colors = colorMap[compatibility.color];

  const handleAskAI = () => {
    const hp = motor?.hp || motor?.horsepower || 0;
    const boatLabel = compatibility.boatLabel || 'my boat';
    
    const prompt = compatibility.status === 'unknown'
      ? `Is the ${hp}HP ${motor?.model} a good motor? What boats is it best for?`
      : `Is the ${hp}HP ${motor?.model} a good match for a ${boatLabel}? ${compatibility.reasons.join('. ')}`;
    
    openChat(prompt);
  };

  // Unknown state - prompt to add boat info
  if (compatibility.status === 'unknown') {
    return (
      <div className={cn(
        'rounded-lg border p-3',
        colors.bg,
        colors.border,
        className
      )}>
        <div className="flex items-start gap-2">
          <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colors.icon)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', colors.text)}>
              {compatibility.label}
            </p>
            {compatibility.reasons.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {compatibility.reasons[0]}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {onAddBoatInfo && (
                <button
                  onClick={onAddBoatInfo}
                  className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  Add boat info →
                </button>
              )}
              <button
                onClick={handleAskAI}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
              >
                <Sparkles className="w-3 h-3" />
                Ask AI
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border p-3',
      colors.bg,
      colors.border,
      className
    )}>
      <div className="flex items-start gap-2">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colors.icon)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', colors.text)}>
            {compatibility.status === 'excellent' && '✅ '}
            {compatibility.status === 'good' && '👍 '}
            {compatibility.status === 'caution' && '⚠️ '}
            {compatibility.status === 'warning' && '❌ '}
            {compatibility.label}
            {compatibility.boatLabel && (
              <span className="font-normal"> for your {compatibility.boatLabel}</span>
            )}
          </p>
          
          {compatibility.reasons.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {compatibility.reasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-400">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={handleAskAI}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-2"
          >
            <Sparkles className="w-3 h-3" />
            Ask AI why
          </button>
        </div>
      </div>
    </div>
  );
};

export default MotorCompatibilityBadge;
