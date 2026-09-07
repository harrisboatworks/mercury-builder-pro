import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('My Quotes confirmed-email claim visibility', () => {
  it('lets RLS return owned and confirmed-email anonymous rows without client-side auth filters', () => {
    const page = read('src/pages/account/MyQuotesPage.tsx');
    const rls = read('supabase/migrations/20260507025955_11966e45-8cf1-4f4f-82ab-80510cd23ade.sql');
    const claim = read('src/pages/quote/QuoteSuccessPage.tsx');

    expect(page).toContain('from "@/integrations/supabase/client"');
    expect(page).toContain('.from("saved_quotes")');
    expect(page).toContain('.select("*")');
    expect(page).not.toMatch(/\.eq\(\s*["']user_id["']/);
    expect(page).not.toContain('service_role');
    expect(page).not.toContain('SERVICE_ROLE');
    expect(page).not.toContain('email_verified');
    expect(page).not.toContain('auth.jwt()');

    expect(rls).toContain('CREATE POLICY "Users can view own saved quotes"');
    expect(rls).toContain('CREATE POLICY "Users can update own saved quotes"');
    expect(rls).toContain('user_id IS NOT NULL AND user_id = auth.uid()');
    expect(rls).toContain('user_id IS NULL');
    expect(rls).toContain("lower(email) = lower(auth.jwt() ->> 'email')");
    expect(rls).toContain("coalesce((auth.jwt() ->> 'email_verified')::boolean, false) = true");

    expect(claim).toContain(".from('saved_quotes')");
    expect(claim).toContain('.update({ user_id: user.id })');
    expect(claim).toContain(".is('user_id', null)");
  });
});
