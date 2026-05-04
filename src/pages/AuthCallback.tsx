import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setSession, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const normalizeNext = (value: string | null | undefined) => {
    if (!value) return "/";
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}` || "/";
      }
    } catch {
      // value may already be a relative path
    }
    return value.startsWith("/") ? value : "/";
  };

  useEffect(() => {
    // Helper: try multiple places for query params — normal search, hash-based query, or encoded path
    const parseParams = () => {
      // prefer React Router params
      const t = params.get("token") || params.get("access_token") || params.get("jwt");
      const e = params.get("error");
      const n = params.get("next");
      if (t || e || n) return { token: t, error: e, next: n };

      // fallback: parse window.location.search
      const search = new URLSearchParams(window.location.search);
      const st = search.get("token") || search.get("access_token") || search.get("jwt");
      const se = search.get("error");
      const sn = search.get("next");
      if (st || se || sn) return { token: st, error: se, next: sn };

      // fallback: parse hash after /auth/callback
      const hash = window.location.hash || ""; // e.g. #/auth/callback?token=... or #/auth/callback/<encoded>/... or #/auth/callback/https://...?
      const marker = "/auth/callback";
      const idx = hash.indexOf(marker);
      if (idx !== -1) {
        const after = hash.slice(idx + marker.length);
        // after may start with ? or /
        if (after.startsWith("?")) {
          const q = new URLSearchParams(after.slice(1));
          return { token: q.get("token") || q.get("access_token") || q.get("jwt"), error: q.get("error"), next: q.get("next") };
        }
        if (after.startsWith("/")) {
          // try decode and extract querystring
          try {
            const decoded = decodeURIComponent(after.slice(1));
            const qidx = decoded.indexOf("?");
            if (qidx !== -1) {
              const q = new URLSearchParams(decoded.slice(qidx + 1));
              return { token: q.get("token") || q.get("access_token") || q.get("jwt"), error: q.get("error"), next: q.get("next") };
            }
            // if decoded is a full URL, use its search
            try { const url = new URL(decoded); const q = new URLSearchParams(url.search); return { token: q.get("token") || q.get("access_token") || q.get("jwt"), error: q.get("error"), next: q.get("next") }; } catch {}
          } catch {}
        }
      }

      // last resort: parse any query-like segment in the hash
      const hashQIdx = hash.indexOf("?");
      if (hashQIdx !== -1) {
        const q = new URLSearchParams(hash.slice(hashQIdx + 1));
        return { token: q.get("token") || q.get("access_token") || q.get("jwt"), error: q.get("error"), next: q.get("next") };
      }

      return { token: null, error: null, next: null };
    };

    const { token, error: err, next } = parseParams();
    if (err) { setError(err); return; }
    if (!token) { setError("Missing auth token in callback"); return; }
    const rawUser = params.get("user");
    let parsedUser;
    if (rawUser) {
      try { parsedUser = JSON.parse(decodeURIComponent(rawUser)); } catch { parsedUser = undefined; }
    }
    setSession(token, parsedUser);
    refresh().finally(() => navigate(normalizeNext(next), { replace: true }));
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
