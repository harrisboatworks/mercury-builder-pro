import React, { useEffect, useMemo, useState } from 'react';
import type { VoiceDiagnostics } from '@/lib/RealtimeVoice';

interface VoiceDiagnosticsPanelProps {
  diagnostics: VoiceDiagnostics | null;
  visibleByDefault?: boolean;
}

export const VoiceDiagnosticsPanel: React.FC<VoiceDiagnosticsPanelProps> = ({
  diagnostics,
  visibleByDefault = false,
}) => {
  const [open, setOpen] = useState(visibleByDefault);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Alt+Shift+D toggles panel
      if (e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setOpen((v) => !v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const rows = useMemo(() => {
    if (!diagnostics) return [];

    return [
      { label: 'Mic', value: diagnostics.micPermission ? '✅ granted' : '❌' },
      { label: 'Token', value: diagnostics.tokenReceived ? '✅ received' : '❌' },
      { label: 'SDP', value: diagnostics.sdpExchanged ? '✅ exchanged' : '❌' },
      { label: 'WebRTC', value: diagnostics.webrtcState },
      { label: 'Data channel', value: diagnostics.dataChannelOpen ? 'open' : 'closed' },
      {
        label: 'Remote track',
        value: diagnostics.remoteTrackReceived ? '✅ received' : '❌ not received',
      },
      { label: 'Inbound bytes', value: String(diagnostics.inboundAudioBytes || 0) },
      { label: 'Audio playing', value: diagnostics.audioPlaying ? '✅' : '❌' },
      { label: 'Last error', value: diagnostics.lastError || '—' },
    ];
  }, [diagnostics]);

  if (!open) return null;

  return (
    <aside className="fixed left-3 bottom-3 z-[60] w-[min(26rem,calc(100vw-1.5rem))] rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-foreground">Voice diagnostics</div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="mt-2 grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1 text-xs">
        {rows.length === 0 ? (
          <div className="col-span-2 text-muted-foreground">No diagnostics yet.</div>
        ) : (
          rows.map((r) => (
            <React.Fragment key={r.label}>
              <div className="text-muted-foreground">{r.label}</div>
              <div className="font-mono text-foreground break-words">{r.value}</div>
            </React.Fragment>
          ))
        )}
      </div>

      <div className="mt-2 text-[11px] text-muted-foreground">
        Toggle: <span className="font-mono">Alt</span>+<span className="font-mono">Shift</span>+<span className="font-mono">D</span>
      </div>
    </aside>
  );
};
