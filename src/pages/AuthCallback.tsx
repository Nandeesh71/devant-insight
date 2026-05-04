import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

function param(params: URLSearchParams, key: string) {
  return params.get(key) || undefined;
}

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
      const t = param(params, "token") || param(params, "access_token") || param(params, "jwt");
      const c = param(params, "code");
      const e = param(params, "error");
      const n = param(params, "next");
      if (t || c || e || n) return { token: t, code: c, error: e, next: n };

      // fallback: parse window.location.search
      const search = new URLSearchParams(window.location.search);
      const st = param(search, "token") || param(search, "access_token") || param(search, "jwt");
      const sc = param(search, "code");
      const se = param(search, "error");
      const sn = param(search, "next");
      if (st || sc || se || sn) return { token: st, code: sc, error: se, next: sn };

      // fallback: parse hash after /auth/callback
      const hash = window.location.hash || ""; // e.g. #/auth/callback?token=... or #/auth/callback/<encoded>/... or #/auth/callback/https://...?
      const marker = "/auth/callback";
      const idx = hash.indexOf(marker);
      if (idx !== -1) {
        const after = hash.slice(idx + marker.length);
        // after may start with ? or /
        if (after.startsWith("?")) {
          const q = new URLSearchParams(after.slice(1));
          return { token: param(q, "token") || param(q, "access_token") || param(q, "jwt"), code: param(q, "code"), error: param(q, "error"), next: param(q, "next") };
        }
        if (after.startsWith("/")) {
          // try decode and extract querystring
          try {
            const decoded = decodeURIComponent(after.slice(1));
            const qidx = decoded.indexOf("?");
            if (qidx !== -1) {
              const q = new URLSearchParams(decoded.slice(qidx + 1));
              return { token: param(q, "token") || param(q, "access_token") || param(q, "jwt"), code: param(q, "code"), error: param(q, "error"), next: param(q, "next") };
            }
            // if decoded is a full URL, use its search
            try { const url = new URL(decoded); const q = new URLSearchParams(url.search); return { token: param(q, "token") || param(q, "access_token") || param(q, "jwt"), code: param(q, "code"), error: param(q, "error"), next: param(q, "next") }; } catch {}
          } catch {}
        }
        // Handle Supabase style fragment: #/auth/callback#access_token=...
        if (after.startsWith("#")) {
          try {
            const q = new URLSearchParams(after.slice(1));
            return { token: param(q, "access_token") || param(q, "token") || param(q, "jwt"), code: param(q, "code"), error: param(q, "error"), next: param(q, "next") };
          } catch {}
        }
      }

      // last resort: parse any query-like segment in the hash
      const hashQIdx = Math.max(hash.indexOf("?"), hash.indexOf("#access_token"), hash.indexOf("#token"));
      if (hashQIdx !== -1) {
        const frag = hash.slice(hashQIdx + 1);
        const q = new URLSearchParams(frag);
        return { token: param(q, "token") || param(q, "access_token") || param(q, "jwt"), code: param(q, "code"), error: param(q, "error"), next: param(q, "next") };
      }

      return { token: null, code: null, error: null, next: null };
    };

    const { token, code, error: err, next } = parseParams();
    if (err) { setError(err); return; }
    const rawUser = params.get("user");
    let parsedUser;
    if (rawUser) {
      try { parsedUser = JSON.parse(decodeURIComponent(rawUser)); } catch { parsedUser = undefined; }
    }

    if (token) {
      setSession(token, parsedUser);
      refresh().finally(() => navigate(normalizeNext(next), { replace: true }));
      return;
    }

    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        const session = data.session;
        const supabaseUser = session?.user;
        if (!session?.access_token || !supabaseUser) {
          setError("Missing Supabase session in callback");
          return;
        }

        setSession(session.access_token, {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || "",
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          provider: "google",
          github_connected: false,
        });
        refresh().finally(() => navigate(normalizeNext(next), { replace: true }));
      }).catch((exchangeError) => {
        setError(exchangeError instanceof Error ? exchangeError.message : "Failed to complete Supabase sign-in");
      });
      return;
    }

    setError("Missing auth token or authorization code in callback");
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
