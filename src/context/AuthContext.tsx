import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  github_login?: string | null;
  github_connected?: boolean;
  provider?: "google" | "github";
};

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
    if (!localStorage.getItem(TOKEN_KEY)) { setUser(null); setLoading(false); return; }
    try {
      setLoading(true);
      const me = await apiClient.get<AuthUser>("/api/auth/me");
      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const setSession = (t: string, u?: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    if (u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u); }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("devant.activeProjectId");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const oauthRedirect = (provider: "google" | "github", mode: "login" | "connect" = "login") => {
    const { API_BASE } = require("@/config/api");
    const redirect = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const t = localStorage.getItem(TOKEN_KEY);
    const tokenParam = mode === "connect" && t ? `&token=${encodeURIComponent(t)}` : "";
    window.location.href = `${API_BASE}/api/auth/${provider}?mode=${mode}&redirect=${redirect}${tokenParam}`;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      signInGoogle: () => oauthRedirect("google", "login"),
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
