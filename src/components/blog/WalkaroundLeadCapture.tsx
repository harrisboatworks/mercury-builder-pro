import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

const PDF_HREF = '/lovable-uploads/HBW-Used-Boat-Walkaround-Guide.pdf';

export default function WalkaroundLeadCapture() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-walkaround', {
        body: { email: email.trim(), firstName: firstName.trim() || undefined },
      });
      if (error || !data?.ok) {
        setStatus('error');
        setErrorMsg('Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="my-6 rounded-lg border border-repower-navy-900/15 bg-repower-paper p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-repower-navy-900" aria-hidden="true" />
          <div className="flex-1">
            <p className="m-0 mb-3 font-display text-base font-semibold text-repower-navy-900">
              Thanks. Check your inbox. You can also download right now:
            </p>
            <a
              href={PDF_HREF}
              download
              className="inline-flex items-center gap-2 rounded bg-repower-navy-900 px-6 py-3 font-sans text-sm font-semibold text-white no-underline transition hover:bg-repower-navy-800"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download the PDF
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-lg border border-repower-navy-900/15 bg-repower-paper p-6">
      <h3 className="m-0 mb-1 font-display text-xl font-bold text-repower-navy-900">
        Get the printable PDF
      </h3>
      <p className="m-0 mb-4 font-sans text-sm text-repower-navy-900/75">
        Free 13-page inspection guide. We'll email you the link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="walkaround-fname" className="sr-only">First name</label>
            <input
              id="walkaround-fname"
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={status === 'loading'}
              autoComplete="given-name"
              className="w-full rounded border border-repower-navy-900/20 bg-white px-3 py-2 font-sans text-sm text-repower-navy-900 placeholder:text-repower-navy-900/40 focus:border-repower-navy-900 focus:outline-none focus:ring-2 focus:ring-repower-navy-900/15"
            />
          </div>
          <div>
            <label htmlFor="walkaround-email" className="sr-only">Email address</label>
            <input
              id="walkaround-email"
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              autoComplete="email"
              className="w-full rounded border border-repower-navy-900/20 bg-white px-3 py-2 font-sans text-sm text-repower-navy-900 placeholder:text-repower-navy-900/40 focus:border-repower-navy-900 focus:outline-none focus:ring-2 focus:ring-repower-navy-900/15"
            />
          </div>
        </div>
        {status === 'error' && errorMsg && (
          <p className="m-0 font-sans text-sm text-red-600">{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center gap-2 rounded bg-repower-navy-900 px-6 py-3 font-sans text-sm font-semibold text-white transition hover:bg-repower-navy-800 disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            'Get the guide'
          )}
        </button>
        <p className="m-0 font-sans text-xs text-repower-navy-900/55">
          One email with the link. No spam. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
