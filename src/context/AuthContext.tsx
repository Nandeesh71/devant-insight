import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { API_BASE } from "@/config/api";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";
import { DEMO_TOKEN, getDemoAuthUser, isDemoToken, validateDemoCredentials } from "@/lib/demoData";

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
  signInDemo: (email: string, password: string) => boolean;
  connectGithub: () => void;
  signOut: () => void;
  setSession: (token: string, user?: AuthUser) => void;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
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

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const tokenExists = !!localStorage.getItem(TOKEN_KEY);
    if (!tokenExists) { setUser(null); setLoading(false); return; }

    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (isDemoToken(currentToken)) {
      const demoUser = getDemoAuthUser();
      setUser(demoUser);
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
      setLoading(false);
      return;
    }

    if ((refresh as any)._inProgress) return;
    const last = (refresh as any)._lastAttempt || 0;
    const now = Date.now();
    if (now - last < 2000) return;
    (refresh as any)._lastAttempt = now;
    (refresh as any)._inProgress = true;
    const silent = opts?.silent === true;
    try {
      setLoading(true);
      const me = await apiClient.get<MeResponse>("/api/auth/me");
      const nextUser = unwrapUser(me);
      if (!nextUser) throw new Error("No user returned");
      setUser(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      if (!silent) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      }
    } finally {
      (refresh as any)._inProgress = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void refresh({ silent: !!user });
  }, [token, user]);

  const setSession = (t: string, u?: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    const nextUser = u || (isDemoToken(t) ? getDemoAuthUser() : null);
    setLoading(!nextUser);
    if (nextUser) { localStorage.setItem(USER_KEY, JSON.stringify(nextUser)); setUser(nextUser); }
  };

  const signOut = () => {
    if (!isDemoToken(token)) {
      void supabase.auth.signOut();
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("devant.activeProjectId");
    setToken(null);
    setUser(null);
    toast.success("Signed out successfully");
    window.location.href = "/login";
  };

  const signInDemo = (email: string, password: string) => {
    if (!validateDemoCredentials(email, password)) return false;
    setSession(DEMO_TOKEN, getDemoAuthUser());
    return true;
  };

  const oauthRedirect = (provider: "github" | "google", mode: "login" | "connect" = "login") => {
    const redirect = encodeURIComponent(`${window.location.origin}/`);
    const t = localStorage.getItem(TOKEN_KEY);
    const tokenParam = mode === "connect" && t ? `&token=${encodeURIComponent(t)}` : "";
    window.location.href = `${API_BASE}/api/auth/${provider}?mode=${mode}&redirect=${redirect}${tokenParam}`;
  };

  const signInGoogle = () => {
    oauthRedirect("google", "login");
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      signInGoogle,
      signInGithub: () => oauthRedirect("github", "login"),
      signInDemo,
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
