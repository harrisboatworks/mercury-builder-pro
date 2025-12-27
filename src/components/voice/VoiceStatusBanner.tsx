import { useVoiceSafe } from "@/contexts/VoiceContext";
import { cn } from "@/lib/utils";

export function VoiceStatusBanner({ className }: { className?: string }) {
  const voice = useVoiceSafe();
  if (!voice?.isConnected) return null;

  const message = voice.isSearching
    ? voice.searchingMessage || "Checking…"
    : voice.isThinking
      ? voice.thinkingMessage || "Hang on…"
      : null;

  if (!message) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-40",
        "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70",
        "border-b border-border",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground shadow-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="truncate">{message}</span>
        </div>
      </div>
    </div>
  );
}
