import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck } from 'lucide-react';
import {
  executeConfirmedChatWrite,
  type ChatPendingWrite,
  type ChatWriteStatus,
} from './chatSessionHelpers';

interface ChatWriteConsentCardProps {
  write: ChatPendingWrite;
  status: ChatWriteStatus;
  onStatusChange: (status: ChatWriteStatus) => void;
}

function confirmAriaLabel(kind: ChatPendingWrite['kind']): string {
  if (kind === 'sms') return 'Confirm send text';
  if (kind === 'price_alert') return 'Confirm price alert';
  return 'Confirm callback request';
}

export function ChatWriteConsentCard({ write, status, onStatusChange }: ChatWriteConsentCardProps) {
  const [errorText, setErrorText] = useState<string | null>(null);
  const actionLockedRef = useRef(false);

  const handleCancel = () => {
    if (actionLockedRef.current || (status !== 'needs_consent' && status !== 'error')) return;
    actionLockedRef.current = true;
    onStatusChange('declined');
  };

  const handleConfirm = async () => {
    if (actionLockedRef.current || (status !== 'needs_consent' && status !== 'error')) return;
    actionLockedRef.current = true;
    onStatusChange('sending');
    setErrorText(null);
    try {
      await executeConfirmedChatWrite(write);
      onStatusChange('sent');
    } catch (error) {
      actionLockedRef.current = false;
      console.error('[Chat] Confirmed write failed:', error);
      setErrorText('That did not go through. Try again, or text us at 647-952-2153.');
      onStatusChange('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 w-full rounded-xl border border-amber-200 bg-amber-50/70 p-3"
    >
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{write.title}</p>
          <p className="mt-0.5 text-xs text-gray-600">{write.description}</p>
          <dl className="mt-2 space-y-0.5 text-xs text-gray-700">
            {write.details.map((detail) => (
              <div key={`${detail.label}-${detail.value}`} className="flex gap-2">
                <dt className="w-12 shrink-0 text-gray-500">{detail.label}</dt>
                <dd className="min-w-0 break-words font-medium">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {status === 'needs_consent' || status === 'error' ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel contact request"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            aria-label={confirmAriaLabel(write.kind)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
          >
            <Phone className="h-3.5 w-3.5" />
            Confirm
          </button>
        </div>
      ) : null}

      {status === 'sending' ? (
        <p className="mt-2 text-xs text-gray-500">Sending…</p>
      ) : null}
      {status === 'sent' ? (
        <p className="mt-2 text-xs text-emerald-700">Confirmed. The team has this.</p>
      ) : null}
      {status === 'declined' ? (
        <p className="mt-2 text-xs text-gray-500">No problem — nothing was sent.</p>
      ) : null}
      {status === 'error' && errorText ? (
        <p className="mt-2 text-xs text-red-700">{errorText}</p>
      ) : null}
    </motion.div>
  );
}
