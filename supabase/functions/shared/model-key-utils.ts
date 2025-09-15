// Shared model key utilities for consistent model key generation across all functions

// Extract HP and code from model text
export function extractHpAndCode(modelText: string): { hp: number | null; code: string | null; fuel: string | null; family: string | null } {
  if (!modelText) return { hp: null, code: null, fuel: null, family: null };
  
  const text = modelText.toUpperCase();
  
  // Extract HP
  const hpMatch = text.match(/(?<!\d)(\d{1,3}(?:\.\d)?)\s*HP?/);
  const hp = hpMatch ? Number(hpMatch[1]) : null;
  
  // Extract fuel type
  const fuel = /EFI/.test(text) ? 'EFI' : null;
  
  // Extract family
  let family = null;
  if (/FOUR\s*STROKE|FOURSTROKE/i.test(text)) family = 'FOURSTROKE';
  else if (/PRO\s*XS|PROXS/i.test(text)) family = 'PROXS';
  else if (/SEAPRO/i.test(text)) family = 'SEAPRO';
  else if (/VERADO/i.test(text)) family = 'VERADO';
  else if (/RACING/i.test(text)) family = 'RACING';
  else if (hp) family = 'FOURSTROKE'; // Default for motors with HP
  
  // Extract code (most specific patterns first)
  let code = null;
  const codePatterns = [
    'EXLHPT', 'ELHPT', 'EXLPT', 'ELPT', 'XLPT', 'LPT',
    'EXLH', 'ELH', 'MLH', 'XLH',
    'EH', 'MH',
    'XXL', 'XL', 'CT', 'DTS', 'JET', 'TILLER', 'REMOTE'
  ];
  
  for (const pattern of codePatterns) {
    if (new RegExp(`\\b${pattern}\\b`).test(text)) {
      code = pattern;
      break;
    }
  }
  
  // Check for L or S as shaft indicators (but not when part of other codes)
  if (!code) {
    if (/\bL\b/.test(text) && !/EL|XL|XXL/.test(text)) code = 'L';
    else if (/\bS\b/.test(text)) code = 'S';
  }
  
  return { hp, code, fuel, family };
}

// Build consistent model key from model text
// Rules:
// 1. Remove year tokens \b20\d{2}\b
// 2. Uppercase
// 3. Replace FOUR STROKE → FOURSTROKE; collapse spaces/dashes
// 4. Keep family + HP + EFI if present + code (ELPT/EXLPT/XL/etc.)
// 5. Join with dashes: FOURSTROKE-25HP-EFI-ELHPT
// 6. Strip extra punctuation
export function buildModelKey(modelText: string): string {
  if (!modelText) return '';
  
  let text = modelText
    .toUpperCase()
    .trim()
    // Remove year tokens
    .replace(/\b20\d{2}\b/g, '')
    // Standardize FOUR STROKE → FOURSTROKE
    .replace(/FOUR\s*STROKE/g, 'FOURSTROKE')
    .replace(/FOUR-STROKE/g, 'FOURSTROKE')
    // Standardize PRO XS → PROXS
    .replace(/PRO\s*XS/g, 'PROXS')
    // Clean up spaces and punctuation
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const { hp, code, fuel, family } = extractHpAndCode(text);
  
  // Build key parts in order: FAMILY-HP-FUEL-CODE
  const keyParts: string[] = [];
  
  if (family) keyParts.push(family);
  if (hp) keyParts.push(`${hp}HP`);
  if (fuel) keyParts.push(fuel);
  if (code) keyParts.push(code);
  
  // If we couldn't parse structured data, fall back to normalized text
  if (keyParts.length === 0) {
    return text
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  return keyParts.join('-');
}
