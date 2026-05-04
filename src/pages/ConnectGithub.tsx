import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Github, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ConnectGithub() {
  const { user, token, loading, connectGithub, signOut, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && !user) {
      void refresh({ silent: true });
    }
  }, [token, user, refresh]);

  useEffect(() => {
    if (!loading && user?.github_connected) navigate("/", { replace: true });
  }, [loading, user?.github_connected, navigate]);

  if (loading || (token && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 animate-spin text-brand" size={18} /> Finalizing sign-in…
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-lift">
          <p className="text-sm text-muted-foreground">
            Signed in token found, but profile is not ready yet.
          </p>
          <button
            onClick={() => void refresh({ silent: true })}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lift">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg">
            <img src="/devant-logo.svg" alt="DevANT" className="h-full w-full text-[#1e293b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Connect GitHub</h1>
            <p className="text-xs text-muted-foreground">Required for real repositories</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-accent/40 p-4">
          <div className="mb-1 text-sm font-semibold text-foreground">Signed in</div>
          <div className="text-sm text-muted-foreground">{user.name || user.email}</div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          Connect your GitHub account so DevANT can list your repositories and let you link only the repos you want to track.
        </p>

        <button
          onClick={connectGithub}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Github size={16} /> Connect GitHub
        </button>
        <button
          onClick={signOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
