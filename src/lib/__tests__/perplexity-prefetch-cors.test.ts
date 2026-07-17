import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const functionSource = readFileSync(
  new URL('../../../supabase/functions/perplexity-prefetch/index.ts', import.meta.url),
  'utf8',
);

const sharedCorsSource = readFileSync(
  new URL('../../../supabase/functions/_shared/cors.ts', import.meta.url),
  'utf8',
);

describe('perplexity-prefetch CORS contract', () => {
  it('uses the shared header list that accepts anonymous session headers', () => {
    expect(functionSource).toContain(
      'import { corsHeaders } from "../_shared/cors.ts";',
    );
    expect(functionSource).not.toMatch(/const corsHeaders\s*=/);
    expect(sharedCorsSource).toContain('x-session-id');
  });
});
