import { useEffect, useRef, useState } from 'react';
import { captureConsultationFragmentToken } from '@/lib/consultation-document-access';
import { redeemConsultationDocument } from '@/lib/consultation-document-client';
import { useNoIndex } from '@/hooks/useNoIndex';

export default function QuoteConsultationDocumentPage() {
  useNoIndex();
  const startedRef = useRef(false);
  const [status, setStatus] = useState<'working' | 'missing'>('working');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const token = captureConsultationFragmentToken();
    if (!token) {
      setStatus('missing');
      return;
    }

    redeemConsultationDocument(token)
      .then(({ signedUrl }) => {
        window.location.replace(signedUrl);
      })
      .catch(() => {
        setStatus('missing');
      });
  }, []);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-repower-navy-900">
        {status === 'missing' ? 'Quote document unavailable' : 'Opening your quote'}
      </h1>
      <p className="mt-3 font-sans text-repower-navy-900/65">
        {status === 'missing'
          ? 'This private quote link is invalid, expired, or has been revoked.'
          : 'One moment while we open your private quote PDF.'}
      </p>
    </div>
  );
}
