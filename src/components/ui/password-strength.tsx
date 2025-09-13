import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export interface PasswordStrengthResult {
  score: number;
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noCommonPatterns: boolean;
  };
  feedback: string[];
}

export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !/(123|abc|password|qwerty|admin)/i.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score >= 5; // All requirements except one optional

  const feedback: string[] = [];
  if (!requirements.minLength) feedback.push("Use at least 12 characters");
  if (!requirements.hasUppercase) feedback.push("Include uppercase letters");
  if (!requirements.hasLowercase) feedback.push("Include lowercase letters");
  if (!requirements.hasNumber) feedback.push("Include numbers");
  if (!requirements.hasSpecial) feedback.push("Include special characters");
  if (!requirements.noCommonPatterns) feedback.push("Avoid common patterns");

  return { score, isValid, requirements, feedback };
};

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
  const { score, isValid, requirements, feedback } = validatePasswordStrength(password);
  
  if (!password) return null;

  const getStrengthColor = () => {
    if (score <= 2) return "bg-destructive";
    if (score <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            score <= 2 && "text-destructive",
            score > 2 && score <= 4 && "text-yellow-600",
            score > 4 && "text-green-600"
          )}>
            {getStrengthText()}
          </span>
        </div>
        <Progress 
          value={(score / 6) * 100} 
          className="h-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(requirements).map(([key, met]) => {
          const labels = {
            minLength: "12+ characters",
            hasUppercase: "Uppercase letter",
            hasLowercase: "Lowercase letter", 
            hasNumber: "Number",
            hasSpecial: "Special character",
            noCommonPatterns: "No common patterns"
          };

          return (
            <div key={key} className={cn(
              "flex items-center gap-1",
              met ? "text-green-600" : "text-muted-foreground"
            )}>
              {met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{labels[key as keyof typeof labels]}</span>
            </div>
          );
        })}
      </div>

      {feedback.length > 0 && !isValid && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Suggestions:</span> {feedback.join(", ")}
        </div>
      )}
    </div>
  );
};