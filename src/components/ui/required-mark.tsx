import { cn } from "@/lib/utils";

interface RequiredMarkProps {
  className?: string;
}

/**
 * Small gold asterisk for required form field labels.
 * Usage: <Label>Name <RequiredMark /></Label>
 */
export const RequiredMark = ({ className }: RequiredMarkProps) => (
  <span
    aria-hidden="true"
    className={cn("text-repower-gold ml-0.5 font-medium", className)}
  >
    *
  </span>
);

export default RequiredMark;
