import { Loader2, AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";

export function LoadingSpinner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full bg-card border border-border shadow-card px-3 py-1.5 text-xs text-muted-foreground">
      <Loader2 size={14} className="animate-spin text-brand" />
      Loading…
    </div>
  );
}

export function ErrorBanner({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (error) setDismissed(false);
  }, [error]);
  if (!error || dismissed) return null;
  return (
    <div className="mx-6 mt-3 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="font-semibold">API error</div>
        <div className="text-xs opacity-90">{error}</div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold underline">
          Retry
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
