import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setSession, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const err = params.get("error");
    const next = params.get("next") || "/";
    if (err) { setError(err); return; }
    if (!token) { setError("Missing auth token in callback"); return; }
    setSession(token);
    refresh().finally(() => navigate(next, { replace: true }));
  }, [params, setSession, refresh, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-lift">
        {error ? (
          <>
            <AlertTriangle className="mx-auto text-destructive mb-3" />
            <h2 className="font-bold text-foreground mb-1">Sign-in failed</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <a href="/login" className="text-sm text-brand hover:underline">← Back to login</a>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-brand mb-3" />
            <p className="text-sm text-muted-foreground">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}
