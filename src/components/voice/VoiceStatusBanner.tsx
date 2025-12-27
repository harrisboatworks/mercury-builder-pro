import { useEffect, useState, useMemo } from "react";
import { useVoiceSafe } from "@/contexts/VoiceContext";
import { cn } from "@/lib/utils";
import { Mic, Brain, Search, Volume2 } from "lucide-react";
import type { VoicePhase } from "@/hooks/useElevenLabsVoice";

// Phase configuration for display
const phaseConfig: Record<VoicePhase, { label: string; icon: typeof Mic; color: string }> = {
  idle: { label: "Idle", icon: Mic, color: "text-muted-foreground" },
  listening: { label: "Listening", icon: Mic, color: "text-green-500" },
  thinking: { label: "Thinking", icon: Brain, color: "text-amber-500" },
  searching: { label: "Searching", icon: Search, color: "text-blue-500" },
  speaking: { label: "Speaking", icon: Volume2, color: "text-primary" },
};

// Format milliseconds to seconds with 1 decimal
function formatMs(ms: number | null): string {
  if (ms === null || ms < 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

export function VoiceStatusBanner({ className }: { className?: string }) {
  const voice = useVoiceSafe();
  const [now, setNow] = useState(performance.now());

  // Update timer every 100ms when connected
  useEffect(() => {
    if (!voice?.isConnected) return;

    const interval = setInterval(() => {
      setNow(performance.now());
    }, 100);

    return () => clearInterval(interval);
  }, [voice?.isConnected]);

  // Extract with safe defaults for hook dependencies
  const turnTiming = voice?.turnTiming ?? { turnStart: null, transcriptAt: null, toolStartAt: null, toolEndAt: null, agentStartAt: null };
  const currentPhase = voice?.currentPhase ?? 'idle';

  // Calculate elapsed times for each phase - MUST be called before any returns
  const phaseElapsed = useMemo(() => {
    if (!turnTiming.turnStart) {
      return { listening: null, thinking: null, searching: null, speaking: null };
    }

    const toolStartTime = turnTiming.toolStartAt || null;
    const toolEndTime = turnTiming.toolEndAt || null;
    const agentStartTime = turnTiming.agentStartAt || null;

    // Calculate durations for completed phases
    const listeningDuration: number | null = null;
    
    let thinkingDuration: number | null = null;
    if (turnTiming.transcriptAt) {
      if (toolStartTime) {
        thinkingDuration = toolStartTime - turnTiming.transcriptAt;
      } else if (agentStartTime) {
        thinkingDuration = agentStartTime - turnTiming.transcriptAt;
      }
    }

    let searchingDuration: number | null = null;
    if (toolStartTime && toolEndTime) {
      searchingDuration = toolEndTime - toolStartTime;
    }

    // Calculate live elapsed for active phase
    let activeElapsed: number | null = null;
    if (currentPhase === 'listening') {
      activeElapsed = null;
    } else if (currentPhase === 'thinking' && turnTiming.transcriptAt) {
      activeElapsed = now - turnTiming.transcriptAt;
    } else if (currentPhase === 'searching' && toolStartTime) {
      activeElapsed = now - toolStartTime;
    } else if (currentPhase === 'speaking' && agentStartTime) {
      activeElapsed = now - agentStartTime;
    }

    return {
      listening: listeningDuration,
      thinking: currentPhase === 'thinking' ? activeElapsed : thinkingDuration,
      searching: currentPhase === 'searching' ? activeElapsed : searchingDuration,
      speaking: currentPhase === 'speaking' ? activeElapsed : null,
    };
  }, [turnTiming, currentPhase, now]);

  // Calculate total turn time - MUST be called before any returns
  const totalTurnTime = useMemo(() => {
    if (!turnTiming.turnStart) return null;
    if (turnTiming.agentStartAt) {
      return turnTiming.agentStartAt - turnTiming.turnStart;
    }
    return now - turnTiming.turnStart;
  }, [turnTiming, now]);

  // Don't render if not connected - AFTER all hooks
  if (!voice?.isConnected) return null;

  const { isSearching, searchingMessage, isThinking, thinkingMessage } = voice;

  // Active message to show
  const activeMessage = isSearching
    ? searchingMessage || "Searching..."
    : isThinking
      ? thinkingMessage || "Thinking..."
      : currentPhase === 'speaking'
        ? "Speaking..."
        : currentPhase === 'listening'
          ? "Listening..."
          : null;

  const hasTurn = turnTiming.turnStart !== null;

  // Get current phase elapsed time
  const currentElapsed = 
    currentPhase === 'thinking' ? phaseElapsed.thinking :
    currentPhase === 'searching' ? phaseElapsed.searching :
    currentPhase === 'speaking' ? phaseElapsed.speaking :
    null;

  const config = phaseConfig[currentPhase];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "sticky top-0 z-40",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "border-b border-border",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Single unified status: Icon + Label + Timer */}
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-4 w-4",
                config.color,
                currentPhase !== 'idle' && "animate-pulse"
              )}
            />
            <span className={cn("text-sm font-medium", config.color)}>
              {activeMessage || config.label}
            </span>
            {currentElapsed !== null && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatMs(currentElapsed)}
              </span>
            )}
          </div>

          {/* Total turn time (right side) */}
          {totalTurnTime !== null && hasTurn && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Total: {formatMs(totalTurnTime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
