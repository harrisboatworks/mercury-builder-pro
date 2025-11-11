import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

type MaskType = "phone" | "postal" | "sin";

interface MaskedInputProps extends React.ComponentProps<typeof Input> {
  maskType: MaskType;
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
  ({ maskType, onChange, value, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const unformatted = unformatters[maskType](rawValue);
    
    // Call onChange with the unformatted value
    // React Hook Form will handle updating the form state
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name: props.name || '',
          value: unformatted,
        },
      } as any);
    }
  };

  // Format the value for display, handling empty values correctly
  const displayValue = value !== undefined && value !== null && value !== '' 
    ? formatters[maskType](String(value)) 
    : '';

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholders[maskType]}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
