import { describe, expect, it } from 'vitest';
import { resolveDepositStagingOrigin } from '../../../supabase/functions/_shared/deposit-staging-origin';
const origin='https://owned-deposit-preview.example.invalid';
const env={ DEPOSIT_STAGING_MODE:'1', SUPABASE_URL:'https://filwwwqgqtwxjxkksmxy.supabase.co', NATIVE_DEPOSIT_REVIEW_ORIGIN:origin };
describe('isolated deposit browser origin',()=>{
  it('allows only the explicit isolated origin',()=>expect(resolveDepositStagingOrigin(origin,env)).toBe(origin));
  it('cannot be enabled on a production project',()=>expect(resolveDepositStagingOrigin(origin,{...env,SUPABASE_URL:'https://production.example.invalid'})).toBeNull());
  it('rejects alternate origins, flag-off, URL paths and credentials',()=>{
    expect(resolveDepositStagingOrigin('https://evil.example.invalid',env)).toBeNull();
    expect(resolveDepositStagingOrigin(origin,{...env,DEPOSIT_STAGING_MODE:'0'})).toBeNull();
    expect(resolveDepositStagingOrigin(origin+'/path',{...env,NATIVE_DEPOSIT_REVIEW_ORIGIN:origin+'/path'})).toBeNull();
    expect(resolveDepositStagingOrigin('https://user:pass@example.invalid',{...env,NATIVE_DEPOSIT_REVIEW_ORIGIN:'https://user:pass@example.invalid'})).toBeNull();
  });
});
