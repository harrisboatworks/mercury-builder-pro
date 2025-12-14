/**
 * Motor Configuration Utilities
 * Smart parsing of Mercury motor model codes to extract start type, control type, etc.
 */

/**
 * Extract start type from Mercury model code
 * Pattern: {HP}{StartCode}{ShaftCode}...
 * Example: "2.5MH FourStroke" → M (manual)
 *          "9.9ELPT FourStroke" → E (electric)
 */
export function extractStartType(modelName: string): 'E' | 'M' | null {
  if (!modelName) return null;
  
  // Remove family suffix to avoid matching 'E' in FourStroke
  const modelCode = modelName
    .replace(/FourStroke|Verado|Pro\s*XS|SeaPro|ProKicker|EFI|Sail\s*Power|Command\s*Thrust/gi, '')
    .trim()
    .toUpperCase();
  
  // Match: HP + Start code (E or M) at specific position
  // Examples: 2.5MH, 9.9ELPT, 8EH, 15EH
  const match = modelCode.match(/^([\d.]+)\s*([EM])/);
  if (match) {
    return match[2] as 'E' | 'M';
  }
  
  // Large motors (40+HP) default to electric - they don't have E/M in code
  const hpMatch = modelCode.match(/^([\d.]+)/);
  if (hpMatch && parseFloat(hpMatch[1]) >= 40) {
    return 'E';
  }
  
  return null;
}

/**
 * Extract control type from Mercury model code
 * 'H' in code position = Tiller, otherwise Remote
 * Example: "9.9ELH" → H (tiller), "9.9ELPT" → R (remote)
 */
export function extractControlType(modelName: string): 'H' | 'R' | null {
  if (!modelName) return null;
  
  const modelCode = modelName
    .replace(/FourStroke|Verado|Pro\s*XS|SeaPro|ProKicker|EFI|Sail\s*Power|Command\s*Thrust/gi, '')
    .trim()
    .toUpperCase();
  
  // Look for H after the HP and start code
  // Pattern: {HP}{E|M}{shaft codes}H
  // Examples: 2.5MH, 9.9ELH, 8MH
  if (modelCode.match(/^[\d.]+\s*[EM]?[LXSM]*H/i)) {
    return 'H'; // Tiller
  }
  
  // Large motors (40+HP) default to remote
  const hpMatch = modelCode.match(/^([\d.]+)/);
  if (hpMatch && parseFloat(hpMatch[1]) >= 40) {
    return 'R';
  }
  
  // If code has PT (Power Trim) or other remote indicators, it's remote
  if (modelCode.includes('PT') || modelCode.includes('CT')) {
    return 'R';
  }
  
  return null;
}

// Helper functions for cleaner component code
export const hasElectricStart = (model: string): boolean => extractStartType(model) === 'E';
export const hasManualStart = (model: string): boolean => extractStartType(model) === 'M';
export const hasTillerControl = (model: string): boolean => extractControlType(model) === 'H';
export const hasRemoteControl = (model: string): boolean => {
  const control = extractControlType(model);
  return control === 'R' || control === null; // null means no tiller, so remote
};
