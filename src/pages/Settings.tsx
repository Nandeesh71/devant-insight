import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Github, Loader2, RefreshCw, Unplug } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const { user, connectGithub, refresh } = useAuth();
  const [disconnecting, setDisconnecting] = useState(false);

  async function onDisconnectGithub() {
    setDisconnecting(true);
    try {
      await apiClient.post<{ success: boolean }>("/api/github/disconnect", {});
      await refresh({ silent: true });
      toast({ title: "GitHub disconnected", description: "Your GitHub account has been disconnected." });
    } catch (e) {
      toast({ title: "Disconnect failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <button
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage integrations and editable account settings.</p>

        <div className="mt-6 space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">GitHub</h2>
                <p className="text-sm text-muted-foreground">
                  {user?.github_connected
                    ? `Connected${user.github_login ? ` as ${user.github_login}` : ""}`
                    : "Not connected"}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  user?.github_connected ? "bg-accent text-brand" : "bg-muted text-muted-foreground"
                }`}
              >
                {user?.github_connected ? "Connected" : "Disconnected"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!user?.github_connected ? (
                <button
                  onClick={connectGithub}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-brand/90"
                >
                  <Github size={14} /> Connect GitHub
                </button>
              ) : (
                <>
                  <button
                    onClick={connectGithub}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <Github size={14} /> Reconnect GitHub
                  </button>
                  <button
                    onClick={onDisconnectGithub}
                    disabled={disconnecting}
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                    Disconnect GitHub
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Session</h2>
            <p className="mt-1 text-sm text-muted-foreground">Refresh your local session data.</p>
            <button
              onClick={() => refresh()}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              <RefreshCw size={14} /> Refresh session
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
