import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNoIndex } from '@/hooks/useNoIndex';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Review = {
  motor: string; amount_cents: number; merchandise_cents: number; currency: 'CAD';
  document_url: string; terms: string; approved: boolean; paid: boolean;
  payment_status: string; test_mode?: boolean; nonce: string | null; review_digest: string;
};
const cad = (cents: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);

type StripeClient = { handleNextAction(args: { clientSecret: string }): Promise<{ error?: { message?: string } }> };
async function stripeClient(): Promise<StripeClient> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || !/^pk_(test|live)_/.test(key)) throw new Error('Payment verification is unavailable. Contact HBW.');
  const win = window as Window & { Stripe?: (key: string) => StripeClient };
  if (!win.Stripe) await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://js.stripe.com/v3/'; script.async = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error('Payment verification could not load. Try again.'));
    document.head.appendChild(script);
  });
  if (!win.Stripe) throw new Error('Payment verification could not load.');
  return win.Stripe(key);
}

export default function AgentDepositReviewPage() {
  useNoIndex();
  const { childId = '' } = useParams();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [capability, setCapability] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [accepted, setAccepted] = useState(false); const [pdfOpened, setPdfOpened] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const { data, error: failed } = await supabase.functions.invoke('native-deposit-review', {
      body: { action, child_id: childId, ...extra }, headers: capability ? { 'x-resume-token': capability } : {},
    });
    if (failed) {
      let message = 'Deposit review is unavailable. Refresh or contact HBW.';
      try { const body = await failed.context?.json(); if (typeof body?.error === 'string') message = body.error; } catch { /* safe fixed fallback */ }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }
  async function perform(task: () => Promise<void>) {
    setBusy(true); setError('');
    try { await task(); } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function refresh() {
    const data = await call('review'); setReview(data); setAccepted(false); setPdfOpened(false);
  }

  return <main className="mx-auto max-w-2xl px-4 py-10" data-clarity-mask="true">
    <Card><CardHeader><CardTitle>Review your reservation deposit</CardTitle></CardHeader><CardContent className="space-y-6">
      <p>Your assistant can prepare this deposit. You review the exact quote and terms here before your wallet can pay.</p>
      {!user ?
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void perform(async () => {
          const { error: failed } = await signIn(email, password); setPassword(''); if (failed) throw new Error('Sign-in failed. Check your email and password.');
        }); }}>
          <p>Sign in with the account that owns your quote.</p>
          <Label htmlFor="deposit-email">Email</Label><Input id="deposit-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
          <Label htmlFor="deposit-password">Password</Label><Input id="deposit-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" disabled={busy}>Sign in</Button>
        </form> : <>
          {!review && <div className="space-y-3">
            <p>For a guest quote, also enter the access code from your saved quote.</p>
            <Label htmlFor="deposit-access">Saved quote access code (guest quotes only)</Label>
            <Input id="deposit-access" type="password" autoComplete="off" value={capability} onChange={e => setCapability(e.target.value)} />
            <Button disabled={busy} onClick={() => void perform(refresh)}>Open my deposit review</Button>
          </div>}
          {review && <div className="space-y-5">
            {review.test_mode && <p className="rounded border border-blue-200 bg-blue-50 p-3 text-blue-900">Sandbox test — no real money is charged.</p>}
            <p className="text-lg font-medium">{review.motor}</p>
            <div className="rounded-lg bg-muted p-4"><p>Reservation deposit</p><p className="text-3xl font-semibold">{cad(review.amount_cents)}</p>
              <p className="mt-2 text-sm">Motor merchandise estimate: {cad(review.merchandise_cents)} before tax. This payment is the deposit only.</p></div>
            <p>{review.terms}</p>
            <p className="text-sm">HBW still confirms the motor, fit, availability and any installation or pickup arrangements. This deposit does not place the final motor order or guarantee stock.</p>
            <a className="inline-block underline" href={review.document_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" onClick={() => setPdfOpened(true)}>Open the exact quote PDF</a>
            <p className="text-sm"><Link className="underline" to="/terms" target="_blank" rel="noopener noreferrer">Deposit terms</Link> · <Link className="underline" to="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</Link></p>
            {review.paid ? <p role="status" className="rounded-lg bg-green-50 p-4 text-green-900">Your {cad(review.amount_cents)} deposit is paid. HBW will confirm the next steps.</p> :
              review.payment_status === 'expired' ? <p role="status">This review expired before payment. Ask your assistant for a fresh quote or contact HBW.</p> : review.payment_status === 'requires_action' ? <Button disabled={busy} onClick={() => void perform(async () => {
                const data = await call('step_up'); const stripe = await stripeClient();
                const result = await stripe.handleNextAction({ clientSecret: data.client_secret });
                if (result.error) throw new Error(result.error.message || 'Payment verification did not finish.'); await refresh();
              })}>Verify payment securely</Button> : review.approved ? <p role="status">Deposit approved. Return to your assistant to finish securely with your wallet, then refresh this page for the receipt.</p> :
                review.nonce ? <div className="space-y-3"><label className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
                  <span>I reviewed the exact quote PDF and approve the {cad(review.amount_cents)} CAD deposit under these terms.</span></label>
                  <Button disabled={busy || !accepted || !pdfOpened} onClick={() => void perform(async () => {
                    await call('approve', { nonce: review.nonce, review_digest: review.review_digest, accept_terms: true }); await refresh();
                  })}>Approve {cad(review.amount_cents)} deposit</Button>
                  {!pdfOpened && <p className="text-sm text-muted-foreground">Open the quote PDF before approving.</p>}
                </div> : <p role="status">Payment reconciliation is pending. Refresh for the latest status or contact HBW before trying another payment.</p>}
            <Button variant="outline" disabled={busy} onClick={() => void perform(refresh)}>Refresh payment status</Button>
          </div>}
        </>}
      {busy && <p role="status">Please wait…</p>}{error && <p role="alert" className="text-destructive">{error}</p>}
    </CardContent></Card>
  </main>;
}
