import * as React from "react";
import { Unplug, GitFork, X, LoaderCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  repoFullName: string;
}

export function DisconnectModal({ isOpen, onClose, onConfirm, repoFullName }: DisconnectModalProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const confirmationString = `disconnect ${repoFullName}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div
        className="absolute inset-0 bg-transparent transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl rounded-2xl shadow-2xl p-8 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Disconnected</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{repoFullName} disconnected</p>
          </div>
        ) : (
          <>
            <div className="bg-red-50 dark:bg-red-950 rounded-full p-3 w-fit mx-auto">
              <Unplug className="text-red-500 w-6 h-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
              Disconnect Repository
            </h2>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              This will permanently unlink this repository from your project. This action cannot be undone.
            </p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-medium mx-auto max-w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-600 transition-colors cursor-default">
              <GitFork className="shrink-0 w-4 h-4" />
              <span className="truncate">{repoFullName}</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              To confirm, type
            </p>

            <div className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 select-all break-all">
              disconnect {repoFullName}
            </div>

            <input
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
              placeholder={`disconnect ${repoFullName}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isDeleting}
            />

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 disabled:opacity-50"
              >
                <X size={16} strokeWidth={1.5} /> Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isMatch || isDeleting}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-colors duration-150",
                  isMatch && !isDeleting
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-red-500 opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                {isDeleting ? (
                  <><LoaderCircle size={16} className="animate-spin" strokeWidth={1.5} /> Disconnecting...</>
                ) : (
                  <><Unplug size={16} strokeWidth={1.5} /> Disconnect</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
