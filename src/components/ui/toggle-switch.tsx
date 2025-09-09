import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export default function ToggleSwitch({ checked, onChange, label, className }: ToggleSwitchProps) {
  return (
    <label className={cn("flex items-center gap-3 cursor-pointer", className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700 select-none">
          {label}
        </span>
      )}
      <div 
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer p-3 -m-3",
          checked ? "bg-primary" : "bg-gray-300"
        )}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label || "Toggle switch"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ml-0.5",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    </label>
  );
}