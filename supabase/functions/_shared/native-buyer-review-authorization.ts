import { nativeDepositActorAuthorized, type NativeActor } from './native-deposit-checkout.ts';
export function nativeBuyerReviewAuthorized(quote: { user_id?: string | null; email?: string | null; resume_token?: string | null },
  user: { id: string; email?: string | null; email_confirmed_at?: string | null }, actor: NativeActor): boolean {
  if (!user.email_confirmed_at || !quote.email || !user.email
    || quote.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) return false;
  return quote.user_id ? quote.user_id === user.id
    : nativeDepositActorAuthorized({ savedQuoteUserId: null, savedQuoteResumeToken: quote.resume_token, actor });
}
