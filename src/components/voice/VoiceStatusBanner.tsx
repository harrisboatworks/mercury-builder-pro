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

// Phase pill component with live timer
function PhasePill({
  phase,
  isActive,
  elapsed,
  duration,
}: {
  phase: VoicePhase;
  isActive: boolean;
  elapsed: number | null;
  duration: number | null;
}) {
  const config = phaseConfig[phase];
  const Icon = config.icon;

  // Show elapsed for active phase, duration for completed phases
  const timeDisplay = isActive ? elapsed : duration;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
        isActive
          ? "bg-card border border-border shadow-sm"
          : "opacity-60"
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          config.color,
          isActive && "animate-pulse"
        )}
      />
      <span className={cn(isActive ? config.color : "text-muted-foreground")}>
        {config.label}
      </span>
      {timeDisplay !== null && (
        <span className="text-muted-foreground tabular-nums">
          {formatMs(timeDisplay)}
        </span>
      )}
    </div>
  );
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

  // Don't render if not connected
  if (!voice?.isConnected) return null;

  const { turnTiming, currentPhase, isSearching, searchingMessage, isThinking, thinkingMessage } = voice;

  // Calculate elapsed times for each phase
  const phaseElapsed = useMemo(() => {
    if (!turnTiming.turnStart) {
      return { listening: null, thinking: null, searching: null, speaking: null };
    }

    const transcriptTime = turnTiming.transcriptAt || now;
    const toolStartTime = turnTiming.toolStartAt || null;
    const toolEndTime = turnTiming.toolEndAt || null;
    const agentStartTime = turnTiming.agentStartAt || null;

    // Calculate durations for completed phases
    const listeningDuration = null; // We don't track listening start separately
    
    let thinkingDuration: number | null = null;
    if (turnTiming.transcriptAt) {
      if (toolStartTime) {
        thinkingDuration = toolStartTime - turnTiming.transcriptAt;
      } else if (agentStartTime) {
        thinkingDuration = agentStartTime - turnTiming.transcriptAt;
      }
    }

    let searchingDuration: number | null = null;
    if (toolStartTime) {
      if (toolEndTime) {
        searchingDuration = toolEndTime - toolStartTime;
      }
    }

    // Calculate live elapsed for active phase
    let activeElapsed: number | null = null;
    if (currentPhase === 'listening') {
      activeElapsed = null; // No specific timer for listening
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

  // Calculate total turn time
  const totalTurnTime = useMemo(() => {
    if (!turnTiming.turnStart) return null;
    if (turnTiming.agentStartAt) {
      return turnTiming.agentStartAt - turnTiming.turnStart;
    }
    // Still in progress
    return now - turnTiming.turnStart;
  }, [turnTiming, now]);

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

  // Only show if we have an active turn or just connected
  const hasTurn = turnTiming.turnStart !== null;
  const phases: VoicePhase[] = ['listening', 'thinking', 'searching', 'speaking'];

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
        <div className="flex items-center justify-between gap-4">
          {/* Left: Status message */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full flex-shrink-0",
                currentPhase === 'speaking' ? "bg-primary animate-pulse" :
                currentPhase === 'searching' ? "bg-blue-500 animate-pulse" :
                currentPhase === 'thinking' ? "bg-amber-500 animate-pulse" :
                "bg-green-500"
              )}
            />
            <span className="text-sm text-foreground truncate">
              {activeMessage || "Voice active"}
            </span>
          </div>

          {/* Right: Phase timeline (show on larger screens or when turn active) */}
          <div className="hidden sm:flex items-center gap-1">
            {hasTurn ? (
              <>
                {phases.map((phase) => {
                  // Only show phases that have started
                  const hasStarted = 
                    phase === 'listening' ? true :
                    phase === 'thinking' ? turnTiming.transcriptAt !== null :
                    phase === 'searching' ? turnTiming.toolStartAt !== null :
                    phase === 'speaking' ? turnTiming.agentStartAt !== null :
                    false;

                  if (!hasStarted && phase !== currentPhase) return null;

                  return (
                    <PhasePill
                      key={phase}
                      phase={phase}
                      isActive={currentPhase === phase}
                      elapsed={phaseElapsed[phase]}
                      duration={phaseElapsed[phase]}
                    />
                  );
                })}

                {/* Total time indicator */}
                {totalTurnTime !== null && turnTiming.turnStart && (
                  <div className="ml-2 pl-2 border-l border-border text-xs text-muted-foreground tabular-nums">
                    Total: {formatMs(totalTurnTime)}
                  </div>
                )}
              </>
            ) : (
              <PhasePill
                phase="listening"
                isActive={true}
                elapsed={null}
                duration={null}
              />
            )}
          </div>
        </div>

        {/* Mobile: Show compact phase indicator */}
        <div className="sm:hidden flex items-center gap-1 mt-1">
          <PhasePill
            phase={currentPhase}
            isActive={true}
            elapsed={
              currentPhase === 'thinking' ? phaseElapsed.thinking :
              currentPhase === 'searching' ? phaseElapsed.searching :
              currentPhase === 'speaking' ? phaseElapsed.speaking :
              null
            }
            duration={null}
          />
          {totalTurnTime !== null && hasTurn && (
            <span className="text-xs text-muted-foreground tabular-nums ml-2">
              Turn: {formatMs(totalTurnTime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
