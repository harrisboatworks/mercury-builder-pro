import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { corsHeaders } from '../../../supabase/functions/_shared/cors';

const functionSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/perplexity-prefetch/index.ts'),
  'utf8',
);

describe('perplexity-prefetch CORS contract', () => {
  it('uses the shared header list that accepts anonymous session headers', () => {
    expect(functionSource).toContain(
      'import { corsHeaders } from "../_shared/cors.ts";',
    );
    expect(functionSource).not.toMatch(/const corsHeaders\s*=/);
    const allowedHeaders = corsHeaders['Access-Control-Allow-Headers']
      .split(',')
      .map((header) => header.trim());
    expect(allowedHeaders).toContain('x-session-id');
  });
});
