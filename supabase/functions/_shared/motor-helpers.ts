// Shared motor parsing helpers - Single source of truth
// Used by all edge functions for consistent model key generation

export type ParsedModel = {
  family: 'FourStroke' | 'ProXS' | 'SeaPro' | 'Verado' | 'Racing' | '';
  hp: number | null;
  fuel: 'EFI' | '';
  code: string; // e.g. ELHPT, ELPT, XL, EXLPT, CT, DTS...
};

// Motor display name formatter function - ensures proper spacing like "8 MH FourStroke"
export function formatMotorDisplayName(modelName: string): string {
  if (!modelName) return '';
  
  let formatted = modelName.trim();
  
  // Add space after HP numbers followed by rigging codes
  // Matches patterns like: 8MH, 9.9ELH, 25ELHPT, 40EXLPT, etc.
  formatted = formatted.replace(
    /(\d+(?:\.\d+)?)(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\b/g, 
    '$1 $2'
  );
  
  // Clean up any double spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
}

// Extracts family / hp / fuel / rigging code from a freeform model string
export function extractHpAndCode(input: string): ParsedModel {
  if (!input) return { family: '', hp: null, fuel: '', code: '' };

  let s = String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ') // drop years
    .replace(/\bfour[\s-]*stroke\b/ig, 'FourStroke')
    .replace(/\bpro[\s-]*xs\b/ig, 'ProXS')
    .replace(/\bsea[\s-]*pro\b/ig, 'SeaPro')
    .replace(/\bverado\b/ig, 'Verado')
    .replace(/\bracing\b/ig, 'Racing')
    .replace(/\befi\b/ig, 'EFI')
    .replace(/\bcommand[\s-]*thrust\b/ig, 'CommandThrust')
    .replace(/\bprokicker\b/ig, 'ProKicker')
    .replace(/\s+/g, ' ')
    .trim();

  const hpMatch = s.match(/\b(\d+(?:\.\d+)?)\s*hp\b/i) || s.match(/\b(\d+(?:\.\d+)?)(?:MH|MLH|MXLH|MXL|MXXL|M)\b/i);
  const hp = hpMatch ? Number(hpMatch[1]) : null;
  s = s.replace(/\b(\d+(?:\.\d+)?)\s*hp\b/ig, '').trim();

  const codeTokens: string[] = [];
  const tokenRx = /\b(ELHPT|ELPT|ELO|ELH|EH|XL|XXL|EXLPT|L|CL|CT|DTS|TILLER|JPO|DIGITAL|POWER(?:\s+)?STEERING|MXXL|MXLH|MXL|MLH|MH|M)\b/ig;
  let m: RegExpExecArray | null;
  while ((m = tokenRx.exec(s)) !== null) codeTokens.push(m[1].toUpperCase());
  
  // Check for Command Thrust and ProKicker designations
  if (/\bCommandThrust\b/i.test(s)) codeTokens.push('CT');
  if (/\bProKicker\b/i.test(s)) codeTokens.push('PK');
  
  const code = codeTokens.join('-');

  const fam = (s.match(/\b(FourStroke|ProXS|SeaPro|Verado|Racing)\b/i)?.[1] || '') as ParsedModel['family'];
  const fuel = /\bEFI\b/i.test(s) ? 'EFI' : '';

  return { family: fam, hp, fuel, code };
}

// Builds normalized key like: FOURSTROKE-25HP-EFI-ELHPT
export function buildModelKey(modelText: string): string {
  if (!modelText) return '';
  const { family, hp, fuel, code } = extractHpAndCode(modelText);
  const parts: string[] = [];
  if (family) parts.push(family.toUpperCase());
  if (hp != null) parts.push(`${hp}HP`.toUpperCase());
  if (fuel) parts.push(fuel.toUpperCase());
  if (code) parts.push(code.toUpperCase());
  if (parts.length) return parts.join('-');

  // fallback: sanitize text
  return modelText.toUpperCase()
    .replace(/\b20\d{2}\b/g, '')
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}