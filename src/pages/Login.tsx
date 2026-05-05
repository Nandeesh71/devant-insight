import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, AlertCircle, Github, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demoData";

export default function Login() {
  const { user, signInGoogle, signInGithub, signInDemo, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate(user.github_connected ? "/" : "/connect-github", { replace: true });
  }, [loading, user, navigate]);

  const handleDemoLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const ok = signInDemo(email, password);
    if (!ok) {
      setError("Use the test credentials shown below to open the demo analytics session.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="animate-pulse" size={14} /> Restoring session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lift p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/devant-logo.svg" alt="DevANT" className="h-full w-full text-[#1e293b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">DevANT</h1>
            <p className="text-xs text-muted-foreground">Developer Activity Narrative Tracker</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground mb-6">Sign in to track your real GitHub activity, or use the test account to see demo analytics.</p>

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

        <div className="mt-6 rounded-2xl border border-border bg-accent/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lock size={14} /> Test login
          </div>
          <p className="text-xs text-muted-foreground">
            Use these credentials to load mock analytics and project data for domain verification.
          </p>

          <form onSubmit={handleDemoLogin} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Mail size={12} /> Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                placeholder={DEMO_EMAIL}
              />
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Lock size={12} /> Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                placeholder={DEMO_PASSWORD}
              />
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Open demo analytics
            </button>
          </form>

          <div className="mt-3 rounded-xl border border-dashed border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">Email:</span> {DEMO_EMAIL}</div>
            <div><span className="font-semibold text-foreground">Password:</span> {DEMO_PASSWORD}</div>
          </div>
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
