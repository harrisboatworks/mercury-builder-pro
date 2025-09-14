import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isTillerMotor as motorHelpersTillerCheck } from '@/lib/motor-helpers'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Additional utility for simple class concatenation
export const cnSimple = (...a: Array<string | false | undefined | null>) => a.filter(Boolean).join(" ");

export function isTillerMotor(model: string): boolean {
  // Re-export the improved function from motor-helpers to avoid duplication
  return motorHelpersTillerCheck(model);
}
