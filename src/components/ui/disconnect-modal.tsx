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
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-center items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[6px] transition-opacity animate-in fade-in duration-200" />

      {/* Modal Card */}
      <div className="relative z-10 w-full sm:w-[440px] max-w-full rounded-t-2xl sm:rounded-2xl bg-white p-8 shadow-[0_24px_64px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 flex flex-col">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-[#18122b]">Disconnected</h3>
            <p className="mt-2 text-sm text-muted-foreground">Nandeesh71/{projectName} disconnected</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f2] text-[#ef4444]">
                <Unplug size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-[18px] font-bold text-[#18122b]">Disconnect Repository</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                This will permanently unlink Nandeesh71/{projectName} from your project. This action cannot be undone.
              </p>
              
              <div className="mt-4 flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <GitFork size={14} strokeWidth={1.5} />
                Nandeesh71/{projectName}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <label className="text-[13px] text-muted-foreground flex items-center flex-wrap gap-1">
                To confirm, type <span className="rounded-md bg-[#f4f2f9] px-1.5 py-0.5 font-mono text-[#7c3aed]">delete {projectName}</span>
              </label>
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isDeleting}
                className={cn(
                  "w-full rounded-[10px] border-[1.5px] px-[14px] py-[10px] font-mono text-[14px] outline-none transition-colors",
                  isMatch ? "border-[#7c3aed] bg-[#faf9ff]" : "border-[#e8e4f0] bg-transparent focus:border-muted-foreground"
                )}
                placeholder={`delete ${projectName}`}
              />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e8e4f0] bg-transparent py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                <X size={16} strokeWidth={1.5} /> Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isMatch || isDeleting}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white transition-all",
                  isMatch && !isDeleting
                    ? "bg-[#ef4444] shadow-sm hover:bg-[#dc2626]"
                    : "bg-[#ef4444] opacity-40 cursor-not-allowed"
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
