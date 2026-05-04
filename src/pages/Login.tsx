import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Github } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { user, signInGoogle, signInGithub, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate(user.github_connected ? "/" : "/connect-github", { replace: true }); }, [user, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lift p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold shadow-brand">DA</div>
          <div>
            <h1 className="text-xl font-bold text-foreground">DevANT</h1>
            <p className="text-xs text-muted-foreground">Developer Activity Narrative Tracker</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground mb-6">Sign in to track your real GitHub activity.</p>

        <div className="space-y-2">
          <button
            onClick={signInGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>
          <button
            onClick={signInGithub}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full bg-foreground hover:opacity-90 text-background text-sm font-semibold transition-opacity"
          >
            <Github size={16} /> Continue with GitHub
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Activity size={12} /> Powered by Perceptronix
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          <Link to="/Terms-of-Service" className="text-brand hover:underline">Terms</Link>
          <span className="mx-2">•</span>
          <Link to="/Privacy-Policy" className="text-brand hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
