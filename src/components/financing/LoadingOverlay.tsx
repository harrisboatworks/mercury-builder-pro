import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({ 
  message = "Loading...", 
  fullScreen = false,
  className 
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 z-10",
        className
      )}
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

export function InlineLoadingIndicator({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
