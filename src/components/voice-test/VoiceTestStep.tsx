import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface VoiceTestStepProps {
  step: number;
  title: string;
  description?: string;
  status: StepStatus;
  details?: string | null;
  children?: React.ReactNode;
}

export const VoiceTestStep: React.FC<VoiceTestStepProps> = ({
  step,
  title,
  description,
  status,
  details,
  children,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-destructive" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
      case 'skipped':
        return <Circle className="w-6 h-6 text-muted-foreground" />;
      default:
        return <Circle className="w-6 h-6 text-muted-foreground/50" />;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'passed':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'failed':
        return 'bg-destructive/10 border-destructive/30';
      case 'running':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step * 0.1 }}
      className={cn(
        'rounded-lg border p-4 transition-colors',
        getStatusBg()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              STEP {step}
            </span>
          </div>
          
          <h3 className="font-semibold text-foreground mt-0.5">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
          
          {details && (
            <p className="text-sm font-mono text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1">
              {details}
            </p>
          )}
          
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
