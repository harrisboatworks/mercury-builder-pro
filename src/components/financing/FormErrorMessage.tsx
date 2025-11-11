import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FormErrorMessageProps {
  error?: string;
  field?: string;
  variant?: "inline" | "alert";
}

export function FormErrorMessage({ error, field, variant = "inline" }: FormErrorMessageProps) {
  if (!error) return null;

  const userFriendlyMessages: Record<string, string> = {
    required: `${field || 'This field'} is required`,
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number (10 digits)',
    postal: 'Please enter a valid postal code (e.g., A1A 1A1)',
    sin: 'Please enter a valid 9-digit SIN',
    min: `${field || 'Value'} must be greater than the minimum`,
    max: `${field || 'Value'} must be less than the maximum`,
    date: 'Please select a valid date',
    minAge: 'You must be at least 18 years old',
  };

  // Try to match error patterns
  let message = error;
  for (const [key, friendly] of Object.entries(userFriendlyMessages)) {
    if (error.toLowerCase().includes(key)) {
      message = friendly;
      break;
    }
  }

  if (variant === "alert") {
    return (
      <Alert variant="destructive" className="animate-fade-in">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <p className="text-sm text-destructive flex items-center gap-1 animate-fade-in">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

interface FormSuccessMessageProps {
  message: string;
  variant?: "inline" | "alert";
}

export function FormSuccessMessage({ message, variant = "inline" }: FormSuccessMessageProps) {
  if (variant === "alert") {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950 animate-fade-in">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">Success</AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <p className="text-sm text-green-600 flex items-center gap-1 animate-fade-in">
      <CheckCircle2 className="h-3 w-3" />
      {message}
    </p>
  );
}

interface FieldValidationIndicatorProps {
  isValid: boolean;
  isTouched: boolean;
  className?: string;
}

export function FieldValidationIndicator({ isValid, isTouched, className }: FieldValidationIndicatorProps) {
  if (!isTouched) return null;
  
  return (
    <CheckCircle2 
      className={cn(
        "h-4 w-4 transition-all",
        isValid ? "text-green-500 animate-scale-in" : "text-transparent",
        className
      )} 
    />
  );
}
