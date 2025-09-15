// Shared motor parsing helpers - Single source of truth
// Used by both frontend and edge functions for consistent model key generation

export type ParsedModel = {
  family: 'FourStroke' | 'ProXS' | 'SeaPro' | 'Verado' | 'Racing' | '';
  hp: number | null;
  fuel: 'EFI' | '';
  code: string; // e.g. ELHPT, ELPT, XL, EXLPT, CT, DTS...
};

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
    .replace(/\s+/g, ' ')
    .trim();

  const hpMatch = s.match(/\b(\d+(?:\.\d+)?)\s*hp\b/i);
  const hp = hpMatch ? Number(hpMatch[1]) : null;
  s = s.replace(/\b(\d+(?:\.\d+)?)\s*hp\b/ig, '').trim();

  const codeTokens: string[] = [];
  const tokenRx = /\b(ELHPT|ELPT|ELO|ELH|EH|XL|XXL|EXLPT|L|CL|CT|DTS|TILLER|JPO|DIGITAL|POWER(?:\s+)?STEERING)\b/ig;
  let m: RegExpExecArray | null;
  while ((m = tokenRx.exec(s)) !== null) codeTokens.push(m[1].toUpperCase());
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

// Unit tests for buildModelKey function
export const testBuildModelKey = () => {
  const tests = [
    {
      input: "2025 Mercury FourStroke 25 HP EFI ELHPT",
      expected: "FOURSTROKE-25HP-EFI-ELHPT"
    },
    {
      input: "150 Pro XS XL",
      expected: "PROXS-150HP-EFI-XL"
    },
    {
      input: "SeaPro 200 HP EXLPT",
      expected: "SEAPRO-200HP-EFI-EXLPT"
    },
    {
      input: "Mercury Verado 300 HP DTS",
      expected: "VERADO-300HP-EFI-DTS"
    },
    {
      input: "FourStroke 9.9 HP EFI ELH",
      expected: "FOURSTROKE-9.9HP-EFI-ELH"
    }
  ];

  console.log('Running buildModelKey tests...');
  const results = tests.map(test => {
    const result = buildModelKey(test.input);
    const passed = result === test.expected;
    console.log(`Input: "${test.input}" → Expected: "${test.expected}" → Got: "${result}" → ${passed ? '✓' : '✗'}`);
    return passed;
  });

  const allPassed = results.every(r => r);
  console.log(`Tests ${allPassed ? 'PASSED' : 'FAILED'}: ${results.filter(r => r).length}/${results.length}`);
  return allPassed;
};