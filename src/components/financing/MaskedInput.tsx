import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MaskType = "phone" | "postal" | "sin";

interface MaskedInputProps extends React.ComponentProps<typeof Input> {
  maskType: MaskType;
  sensitive?: boolean;
}

const formatters: Record<MaskType, (value: string) => string> = {
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  },
  postal: (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  },
  sin: (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  },
};

const unformatters: Record<MaskType, (value: string) => string> = {
  phone: (value: string) => value.replace(/\D/g, ''),
  postal: (value: string) => value.replace(/\s/g, '').toUpperCase(),
  sin: (value: string) => value.replace(/\D/g, ''),
};

const placeholders: Record<MaskType, string> = {
  phone: "(555) 123-4567",
  postal: "A1A 1A1",
  sin: "123-456-789",
};

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ maskType, onChange, value, sensitive = false, className, type, ...props }, ref) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const unformatted = unformatters[maskType](rawValue);

      // Keep React Hook Form's normal event contract. This works for both
      // Controller fields and registered fields while storing only raw values.
      if (onChange) {
        e.target.value = unformatted;
        onChange(e);
      }
    };

    // Format the value for display, handling empty values correctly.
    const displayValue = value !== undefined && value !== null && value !== ''
      ? formatters[maskType](String(value))
      : '';

    const input = (
      <Input
        {...props}
        ref={ref}
        type={sensitive ? (isRevealed ? "text" : "password") : type}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholders[maskType]}
        className={cn(sensitive && "pr-12", className)}
      />
    );

    if (!sensitive) return input;

    return (
      <div className="relative">
        {input}
        <button
          type="button"
          onClick={() => setIsRevealed((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={isRevealed ? "Hide Social Insurance Number" : "Show Social Insurance Number"}
          aria-pressed={isRevealed}
        >
          {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);

MaskedInput.displayName = "MaskedInput";
