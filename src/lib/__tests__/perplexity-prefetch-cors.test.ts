import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const functionSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/perplexity-prefetch/index.ts'),
  'utf8',
);

const sharedCorsSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/cors.ts'),
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
