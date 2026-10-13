import { expect,it } from 'vitest';
import { nativeBuyerReviewAuthorized } from '../../../supabase/functions/_shared/native-buyer-review-authorization';
const actor={userId:'buyer',resumeCapability:null};
it('requires confirmed buyer email as well as saved-quote ownership',()=>{
  const quote={user_id:'buyer',email:'buyer@example.invalid'};
  expect(nativeBuyerReviewAuthorized(quote,{id:'buyer',email:'buyer@example.invalid',email_confirmed_at:'now'},actor)).toBe(true);
  expect(nativeBuyerReviewAuthorized(quote,{id:'buyer',email:'staff@example.invalid',email_confirmed_at:'now'},actor)).toBe(false);
  expect(nativeBuyerReviewAuthorized(quote,{id:'buyer',email:'buyer@example.invalid'},actor)).toBe(false);
});
it('requires a guest capability plus the matching confirmed buyer account',()=>{
  const cap='dep_'+'a'.repeat(24);const quote={user_id:null,email:'buyer@example.invalid',resume_token:cap};
  const user={id:'buyer',email:'buyer@example.invalid',email_confirmed_at:'now'};
  expect(nativeBuyerReviewAuthorized(quote,user,actor)).toBe(false);
  expect(nativeBuyerReviewAuthorized(quote,user,{...actor,resumeCapability:cap})).toBe(true);
});
