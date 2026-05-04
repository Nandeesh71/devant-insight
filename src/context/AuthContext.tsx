import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { API_BASE } from "@/config/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  github_login?: string | null;
  github_connected?: boolean;
  provider?: "google" | "github";
};

type MeResponse = AuthUser | { user: AuthUser };

function unwrapUser(me: MeResponse | null): AuthUser | null {
  if (!me) return null;
  return typeof me === "object" && "user" in me ? me.user : me;
}

type Ctx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signInGoogle: () => void;
  signInGithub: () => void;
  connectGithub: () => void;
  signOut: () => void;
  setSession: (token: string, user?: AuthUser) => void;
  refresh: () => Promise<void>;
};

const TOKEN_KEY = "devant.token";
const USER_KEY = "devant.user";
const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState<boolean>(!!token && !user);

  const refresh = useCallback(async () => {
    // Prevent refresh storms: skip if no token, if already refreshing, or if last attempt was very recent
    const tokenExists = !!localStorage.getItem(TOKEN_KEY);
    if (!tokenExists) { setUser(null); setLoading(false); return; }

    // module-level guards via refs
    if ((refresh as any)._inProgress) return;
    const last = (refresh as any)._lastAttempt || 0;
    const now = Date.now();
    if (now - last < 2000) return; // avoid retrying faster than 2s
    (refresh as any)._lastAttempt = now;
    (refresh as any)._inProgress = true;
    try {
      setLoading(true);
      const me = await apiClient.get<MeResponse>("/api/auth/me");
      const nextUser = unwrapUser(me);
      if (!nextUser) throw new Error("No user returned");
      setUser(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } finally {
      (refresh as any)._inProgress = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const setSession = (t: string, u?: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setLoading(!u);
    if (u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u); }
  };

  const signOut = () => {
    void supabase.auth.signOut();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("devant.activeProjectId");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const oauthRedirect = (provider: "github", mode: "login" | "connect" = "login") => {
    const redirect = encodeURIComponent(`${window.location.origin}/`);
    const t = localStorage.getItem(TOKEN_KEY);
    const tokenParam = mode === "connect" && t ? `&token=${encodeURIComponent(t)}` : "";
    window.location.href = `${API_BASE}/api/auth/${provider}?mode=${mode}&redirect=${redirect}${tokenParam}`;
  };

  const signInGoogle = () => {
    if (!isSupabaseConfigured) {
      const message = encodeURIComponent("Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
      window.location.href = `${window.location.origin}/auth/callback?error=${message}`;
      return;
    }
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      signInGoogle,
      signInGithub: () => oauthRedirect("github", "login"),
      connectGithub: () => oauthRedirect("github", "connect"),
      signOut, setSession, refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
