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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Welcome Back!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <span className="text-base font-light text-muted-foreground">
              We found your saved financing application:
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Bullet list outside AlertDialogDescription for proper inline layout */}
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-foreground">•</span>
            <span>Step {draftData.currentStep} of 7: {stepTitles[draftData.currentStep]}</span>
          </li>
          
          {draftData.motorModel && (
            <li className="flex items-center gap-2">
              <span className="text-foreground">•</span>
              <span>Motor: {draftData.motorModel}</span>
            </li>
          )}
          
          {draftData.amountToFinance && (
            <li className="flex items-center gap-2">
              <span className="text-foreground">•</span>
              <span>Amount to Finance: ${draftData.amountToFinance.toLocaleString()}</span>
            </li>
          )}
          
          <li className="flex items-center gap-2">
            <span className="text-foreground">•</span>
            <span>Last saved: {formatRelativeTime(draftData.lastSaved)}</span>
          </li>
        </ul>
        
        <p className="text-sm text-muted-foreground pt-2">
          Would you like to continue where you left off?
        </p>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-2">
          <AlertDialogCancel
            onClick={onStartFresh}
            className="font-light sm:order-1"
          >
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinue}
            className="font-light sm:order-2"
          >
            Continue Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
