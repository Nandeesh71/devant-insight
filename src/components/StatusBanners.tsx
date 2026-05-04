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
    <div className="mx-6 mt-6 mb-2">
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
        <div className="mt-0.5 rounded-full bg-red-100 p-1.5 dark:bg-red-900/50">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
            System Alert
          </h4>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400/90 leading-relaxed">
            {error}
          </p>
          {onRetry && (
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-700 underline underline-offset-4 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Try again
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
