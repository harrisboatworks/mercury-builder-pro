import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Download, Loader2, FileText } from 'lucide-react';

const PDF_HREF = '/lovable-uploads/HBW-Used-Boat-Walkaround-Guide.pdf';

export default function WalkaroundLeadCapture() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('subscribe-walkaround', {
        body: { email: email.trim(), firstName: firstName.trim() || undefined },
      });
      if (fnErr || !data?.ok) {
        setError('Something went wrong. Please try again or email us directly.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="my-8 rounded-lg border border-[#20384d]/15 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-[#20384d]" />
          <div className="flex-1">
            <h3 className="m-0 text-lg font-semibold text-[#20384d]">You're in. Grab the guide below.</h3>
            <p className="mt-1 mb-4 text-sm text-[#20384d]/75">
              We've also emailed you the link so you can find it later.
            </p>
            <a
              href={PDF_HREF}
              download
              className="inline-flex items-center gap-2 rounded-md bg-[#20384d] px-5 py-3 text-sm font-medium text-white no-underline transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download the PDF
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 overflow-hidden rounded-lg border border-[#20384d]/15 bg-white shadow-sm">
      <div className="bg-[#20384d] px-6 py-4 md:px-8">
        <div className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5" />
          <h3 className="m-0 text-lg font-semibold">Get the printable PDF</h3>
        </div>
      </div>
      <div className="px-6 py-6 md:px-8">
        <p className="mt-0 mb-5 text-sm text-[#20384d]/80">
          Free 13-page inspection guide. We'll email you the link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="walkaround-fname">First name (optional)</Label>
              <Input
                id="walkaround-fname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                autoComplete="given-name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="walkaround-email">
                Email <span className="text-[#20384d]/60">(required)</span>
              </Label>
              <Input
                id="walkaround-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="mt-1"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#20384d] text-white hover:opacity-90 md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Get the guide'
            )}
          </Button>
          <p className="m-0 text-xs text-[#20384d]/60">
            One email with the link. No spam. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
