/**
 * Shared motor title formatting utilities for responsive displays
 */

/**
 * Compact motor name for mobile - removes FourStroke suffix to save space
 */
export function getCompactMotorName(model?: string): string {
  if (!model) return '';
  return model
    .replace(/\s*FourStroke\s*/gi, ' ')
    .replace(/\s*4-Stroke\s*/gi, ' ')
    .replace(/\s*Four\s*Stroke\s*/gi, ' ')
    .replace(/\s*Fourstroke\s*/gi, ' ')
    .trim()
    .replace(/\s+/g, ' '); // collapse multiple spaces
}

/**
 * Full motor name (unchanged, for desktop display)
 */
export function getFullMotorName(model?: string): string {
  return model?.trim() || '';
}

/**
 * Responsive motor name based on context
 * @param model - Motor model string
 * @param isMobile - Whether to use compact format
 */
export function getResponsiveMotorName(
  model?: string, 
  isMobile: boolean = false
): string {
  return isMobile ? getCompactMotorName(model) : getFullMotorName(model);
}
