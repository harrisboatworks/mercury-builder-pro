export const MOBILE_ACTIVE_CLASSES = {
  // Subtle scale-down on press
  scale: 'active:scale-[0.97] transition-transform duration-75',
  
  // Combined scale + opacity (luxury standard)
  luxury: 'active:scale-[0.98] active:opacity-95 transition-all duration-100',
  
  // For dark buttons (black, navy)
  darkButton: 'active:scale-[0.97] active:bg-gray-900 transition-all duration-100',
  
  // For light/outline buttons
  lightButton: 'active:scale-[0.98] active:bg-gray-50 transition-all duration-100',
  
  // For text/link buttons
  textButton: 'active:opacity-70 transition-opacity duration-100',
} as const;

// Helper to combine with existing classes
export function withMobileFeedback(
  baseClasses: string, 
  feedbackType: keyof typeof MOBILE_ACTIVE_CLASSES = 'luxury'
): string {
  return `${baseClasses} ${MOBILE_ACTIVE_CLASSES[feedbackType]}`;
}
