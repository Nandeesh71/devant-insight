import * as React from "react";
import { Unplug, GitFork, X, LoaderCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
}

export function DisconnectModal({ isOpen, onClose, onConfirm, projectName }: DisconnectModalProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const confirmationString = `delete ${projectName}`;
  const isMatch = inputValue === confirmationString;

  React.useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setIsDeleting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting && !isSuccess) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isDeleting, isSuccess]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isMatch || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[oklch(10%_0.01_350_/_0.5)] transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-full flex-col rounded-t-2xl border border-border bg-background p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)] duration-200 animate-in slide-in-from-bottom-8 sm:w-[440px] sm:rounded-2xl sm:p-8 sm:zoom-in-95">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Disconnected</h3>
            <p className="mt-2 text-sm text-muted-foreground">Nandeesh71/{projectName} disconnected</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Unplug size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Disconnect Repository</h2>
              <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
                This will permanently unlink Nandeesh71/{projectName} from your project. This action cannot be undone.
              </p>
              
              <div className="mt-4 flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <GitFork size={14} strokeWidth={1.5} />
                Nandeesh71/{projectName}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <label className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                To confirm, type <span className="rounded-md bg-accent px-1.5 py-0.5 font-mono text-foreground">delete {projectName}</span>
              </label>
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isDeleting}
                className={cn(
                  "w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
                  isMatch ? "border-destructive bg-destructive/5" : ""
                )}
                placeholder={`delete ${projectName}`}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <X size={16} strokeWidth={1.5} /> Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isMatch || isDeleting}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors",
                  isMatch && !isDeleting
                    ? "bg-destructive shadow-sm hover:bg-destructive/90"
                    : "cursor-not-allowed bg-destructive/40"
                )}
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" strokeWidth={1.5} /> Disconnecting...
                  </>
                ) : (
                  <>
                    <Unplug size={16} strokeWidth={1.5} /> Disconnect
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
