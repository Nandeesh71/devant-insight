import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { toast } from "@/components/ui/sonner";

function param(params: URLSearchParams, key: string) {
  return params.get(key) || undefined;
}

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setSession, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasToasted = useRef(false);
  const maxRetries = 3;

  const normalizeNext = (value: string | null | undefined) => {
    if (!value) return "/dashboard";
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}` || "/";
      }
    } catch {
      // value may already be a relative path
    }
    return value.startsWith("/") ? value : "/dashboard";
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

      // Supabase uses fragment: /auth/callback#access_token=...&type=recovery or /auth/callback#code=...
      const hash = window.location.hash.slice(1); // remove leading #
      if (hash) {
        const frag = new URLSearchParams(hash);
        const ft = param(frag, "access_token") || param(frag, "token") || param(frag, "jwt");
        const fc = param(frag, "code");
        const fe = param(frag, "error") || param(frag, "error_description");
        if (ft || fc || fe) {
          console.log("[AuthCallback] Found in fragment:", { has_token: !!ft, has_code: !!fc, has_error: !!fe });
          return { token: ft, code: fc, error: fe, next: sn };
        }
      }

      // fallback: parse hash after /auth/callback
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
      // Use silent refresh so a transient backend validation failure doesn't
      // immediately clear the session and send the user back to login.
      refresh({ silent: true }).finally(() => {
        if (!hasToasted.current) {
          hasToasted.current = true;
          toast.success("Welcome back!", {
            style: {
              background: "#1e1b3a",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              color: "#ddd6fe",
            },
            icon: "✦",
          });
        }
        navigate(normalizeNext(next), { replace: true });
      });
      return;
    }

    if (code) {
      void apiClient
        .post<{ token: string; user?: import("@/context/AuthContext").AuthUser }>("/api/auth/exchange", { code })
        .then((res) => {
          if (!res?.token) {
            setError("Missing token from backend exchange");
            return;
          }
          setSession(res.token, res.user);
          refresh({ silent: true }).finally(() => {
            if (!hasToasted.current) {
              hasToasted.current = true;
              toast.success("Welcome back!", {
                style: {
                  background: "#1e1b3a",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  color: "#ddd6fe",
                },
                icon: "✦",
              });
            }
            navigate(normalizeNext(next || "/dashboard"), { replace: true });
          });
        })
        .catch((exchangeError) => {
          setError(exchangeError instanceof Error ? exchangeError.message : "Failed to complete sign-in");
        });
      return;
    }

    // If no token or code found, wait a moment and retry (Supabase may be slow to redirect)
    if (retryCount < maxRetries) {
      console.warn(`[AuthCallback] No token/code on attempt ${retryCount + 1}/${maxRetries}, retrying...`);
      const timer = setTimeout(() => setRetryCount(retryCount + 1), 1500);
      return () => clearTimeout(timer);
    }
    
    // After max retries, show error with hint
    const hint = 
      "The Google OAuth response may not have completed. Try: (1) Clear browser cache, (2) Check Google OAuth app settings, (3) Ensure redirect_uri matches exactly.";
    setError(`Missing auth token or code in callback. ${hint}`);
  }, [params, setSession, refresh, navigate, retryCount]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-lift">
        {error ? (
          <>
            <AlertTriangle className="mx-auto text-destructive mb-3" />
            <h2 className="font-bold text-foreground mb-1">Sign-in failed</h2>
            <p className="text-xs text-muted-foreground mb-4" style={{ maxHeight: "150px", overflowY: "auto" }}>{error}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem("devant.token");
                  localStorage.removeItem("devant.user");
                  window.location.href = "/login";
                }}
                className="w-full text-sm text-brand hover:underline"
              >
                ← Clear cache & back to login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full text-sm text-muted-foreground hover:text-brand"
              >
                🔄 Retry (refresh page)
              </button>
            </div>
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
