import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

export function ErrorAlert({ 
  title = "Error", 
  message, 
  onDismiss, 
  className,
  actions 
}: ErrorAlertProps) {
  return (
    <Alert 
      variant="destructive" 
      className={cn("relative", className)}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {actions && <div className="mt-3 flex gap-2">{actions}</div>}
      </AlertDescription>
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0"
          aria-label="Dismiss error message"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}

export function SuccessAlert({ 
  title = "Success", 
  message, 
  onDismiss,
  className 
}: ErrorAlertProps) {
  return (
    <Alert 
      className={cn("relative border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100", className)}
      role="status"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="mt-2">{message}</AlertDescription>
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900"
          aria-label="Dismiss success message"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
