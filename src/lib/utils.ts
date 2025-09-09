import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Additional utility for simple class concatenation
export const cnSimple = (...a: Array<string | false | undefined | null>) => a.filter(Boolean).join(" ");

export function isTillerMotor(model: string): boolean {
  const upperModel = model.toUpperCase();
  
  // Check for explicit tiller indicators
  if (upperModel.includes('BIG TILLER') || upperModel.includes('TILLER')) {
    return true;
  }
  
  // Check for MH pattern (Manual start, tiller Handle) - must be preceded by space or start of string
  // and followed by space or end of string to avoid false matches
  const mhPattern = /(^|\s)MH(\s|$)/;
  if (mhPattern.test(upperModel)) {
    return true;
  }
  
  // Check for standalone H pattern (not part of HP, ELH, etc.)
  // Must be preceded by space and followed by space or end of string
  const standaloneHPattern = /\s H(\s|$)/;
  if (standaloneHPattern.test(upperModel)) {
    return true;
  }
  
  return false;
}
