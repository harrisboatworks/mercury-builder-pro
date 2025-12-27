import React, { useEffect, useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { VoiceDiagnostics } from '@/lib/RealtimeVoice';
import { MicLevelMeter } from './MicLevelMeter';

interface VoiceDiagnosticsPanelProps {
  diagnostics: VoiceDiagnostics | null;
  visibleByDefault?: boolean;
}

export const VoiceDiagnosticsPanel: React.FC<VoiceDiagnosticsPanelProps> = ({
  diagnostics,
  visibleByDefault = false,
}) => {
  const [open, setOpen] = useState(visibleByDefault);
  const [autoShowTimer, setAutoShowTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Auto-show for 10 seconds when voice connects
  useEffect(() => {
    if (diagnostics?.dataChannelOpen && !open) {
      setOpen(true);
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setOpen(false);
      }, 10000);
      
      setAutoShowTimer(timer);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [diagnostics?.dataChannelOpen]);

  // Clear auto-hide timer if user manually interacts
  const handleManualClose = () => {
    if (autoShowTimer) {
      clearTimeout(autoShowTimer);
      setAutoShowTimer(null);
    }
    setOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Option+Shift+D (Mac) or Alt+Shift+D (Windows) toggles panel
      // On Mac, e.altKey is true when Option is pressed
      if (e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.key === 'Î' || e.key === '∂')) {
        e.preventDefault();
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
      { label: 'Session created', value: diagnostics.sessionCreatedReceived ? '✅ received' : '⏳ waiting' },
      { label: 'SDP', value: diagnostics.sdpExchanged ? '✅ exchanged' : '❌' },
      { label: 'WebRTC', value: diagnostics.webrtcState },
      { label: 'Data channel', value: diagnostics.dataChannelOpen ? 'open' : 'closed' },
      {
        label: 'Remote track',
        value: diagnostics.remoteTrackReceived ? '✅ received' : '❌ not received',
      },
      { label: 'Inbound bytes', value: String(diagnostics.inboundAudioBytes || 0) },
      // New audio output diagnostics
      { label: 'AudioContext', value: diagnostics.audioContextState || 'none' },
      { label: 'Web Audio routed', value: diagnostics.webAudioRouted ? '✅' : '❌' },
      { label: 'Audio element', value: diagnostics.audioElementPlaying ? '✅ playing' : '❌' },
      { label: 'Audio playing', value: diagnostics.audioPlaying ? '✅' : '❌' },
      { label: 'Last error', value: diagnostics.lastError || '—' },
    ];
  }, [diagnostics]);

  const copyDiagnostics = () => {
    const text = [
      ...rows.map(r => `${r.label}: ${r.value}`),
      `Mic input level: ${diagnostics?.micInputLevel?.toFixed(4) || 0}`,
      `Mic peak level: ${diagnostics?.micPeakLevel?.toFixed(4) || 0}`,
      `Output level: ${diagnostics?.outputAudioLevel?.toFixed(4) || 0}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!open) return null;

  return (
    <aside className="fixed left-3 bottom-3 z-[60] w-[min(26rem,calc(100vw-1.5rem))] rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings2 className="w-4 h-4" />
          Voice diagnostics
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted"
            onClick={copyDiagnostics}
          >
            Copy
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleManualClose}
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1 text-xs">
        {/* Mic input level meter - prominent at top */}
        <div className="text-muted-foreground">Mic input</div>
        <div className="font-mono text-foreground">
          <MicLevelMeter
            level={diagnostics?.micInputLevel || 0}
            peak={diagnostics?.micPeakLevel || 0}
            isActive={!!diagnostics?.micPermission}
          />
        </div>
        
        {/* Output audio level meter */}
        <div className="text-muted-foreground">Output level</div>
        <div className="font-mono text-foreground">
          <MicLevelMeter
            level={diagnostics?.outputAudioLevel || 0}
            peak={diagnostics?.outputAudioLevel || 0}
            isActive={!!diagnostics?.webAudioRouted}
          />
        </div>
        
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
        Toggle: <span className="font-mono">⌥ Option</span>+<span className="font-mono">Shift</span>+<span className="font-mono">D</span>
      </div>
    </aside>
  );
};

// Standalone debug button to open diagnostics panel
export const VoiceDiagnosticsButton: React.FC<{
  onClick: () => void;
  isConnected: boolean;
}> = ({ onClick, isConnected }) => {
  if (!isConnected) return null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
      title="Open voice diagnostics"
    >
      <Settings2 className="w-4 h-4" />
    </button>
  );
};
