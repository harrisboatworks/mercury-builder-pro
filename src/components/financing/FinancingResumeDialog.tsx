import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SavedDraft {
  currentStep: number;
  lastSaved: string; // ISO timestamp
  motorModel?: string;
  amountToFinance?: number;
}

interface FinancingResumeDialogProps {
  open: boolean;
  draftData: SavedDraft | null;
  onContinue: () => void;
  onStartFresh: () => void;
}

const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const stepTitles: Record<number, string> = {
  1: "Purchase Details",
  2: "Personal Information",
  3: "Employment",
  4: "Financial Information",
  5: "Co-Applicant",
  6: "References",
  7: "Review & Submit",
};

export function FinancingResumeDialog({
  open,
  draftData,
  onContinue,
  onStartFresh,
}: FinancingResumeDialogProps) {
  if (!draftData) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md rounded-sm border-repower-navy-900/10 bg-repower-paper p-6 text-left text-repower-navy-900 shadow-2xl">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-display text-2xl font-semibold text-repower-navy-900">
            Welcome back
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-[15px] text-repower-navy-900/65">
            We found your saved financing application:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Bullet list with proper inline layout */}
        <ul className="space-y-2 rounded-sm border border-repower-gold/35 bg-repower-cream p-4 text-left font-sans text-sm text-repower-navy-900/70">
          <li className="flex flex-row items-center gap-2">
            <span className="shrink-0 text-repower-gold">•</span>
            <span>Step {draftData.currentStep} of 7: {stepTitles[draftData.currentStep]}</span>
          </li>
          
          {draftData.motorModel && (
            <li className="flex flex-row items-center gap-2">
              <span className="shrink-0 text-repower-gold">•</span>
              <span>Motor: {draftData.motorModel}</span>
            </li>
          )}
          
          {draftData.amountToFinance && (
            <li className="flex flex-row items-center gap-2">
              <span className="shrink-0 text-repower-gold">•</span>
              <span>Amount to Finance: ${draftData.amountToFinance.toLocaleString()}</span>
            </li>
          )}
          
          <li className="flex flex-row items-center gap-2">
            <span className="shrink-0 text-repower-gold">•</span>
            <span>Last saved: {formatRelativeTime(draftData.lastSaved)}</span>
          </li>
        </ul>
        
        <p className="pt-2 text-left font-sans text-sm text-repower-navy-900/65">
          Would you like to continue where you left off?
        </p>
        
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 pt-2">
          <AlertDialogCancel
            onClick={onStartFresh}
            className="h-11 rounded-none border-repower-navy-900/20 bg-white font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-repower-navy-900"
          >
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinue}
            className="h-11 rounded-none bg-repower-mercury-red font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:bg-repower-mercury-red-deep"
          >
            Continue Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
