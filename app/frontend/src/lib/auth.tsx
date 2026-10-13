import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role } from "@/types/student";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession, endSession } from "@/lib/session";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
  department: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "success-copilot-session";

function readSession(): SessionUser | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SessionUser) : null;
  } catch {
    return null;
  }
}

// Turn a failed /auth/session call into a message that says what is actually wrong.
function describeSessionError(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    const text = typeof detail === "string" ? detail : "";
    if (error.status === 401) return text || "The server could not verify your Supabase sign-in.";
    if (error.status === 403) return text || "Your account has no access profile yet.";
    if (error.status >= 500) return `Server error (${error.status}). ${text || "Check the backend database connection."}`;
    return text || `Request failed (${error.status}).`;
  }
  return "Could not reach the backend. Check that the API is running.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const save = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const clearLocalSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const exchangeSession = useCallback(async (accessToken: string, clearCache: boolean) => {
    const profile = await apiPost<SessionUser>("/auth/session", { access_token: accessToken });
    if (clearCache) beginSession();
    save(profile);
  }, [save]);

  const login = useCallback(async (email: string, password: string) => {
    if (!password.trim()) throw new Error("Enter your password to continue.");
    if (!isSupabaseConfigured) throw new Error("Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) throw new Error(error?.message ?? "Unable to sign in.");

    try {
      await exchangeSession(data.session.access_token, true);
    } catch (sessionError) {
      await supabase.auth.signOut().catch(() => undefined);
      throw new Error(describeSessionError(sessionError));
    }
  }, [exchangeSession]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        void exchangeSession(data.session.access_token, false).catch(() => clearLocalSession());
      } else if (readSession()) {
        clearLocalSession();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) {
        window.setTimeout(() => void exchangeSession(session.access_token, false).catch(() => undefined), 0);
      }
      if (event === "SIGNED_OUT" && readSession()) clearLocalSession();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [clearLocalSession, exchangeSession]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    } finally {
      clearLocalSession();
      await endSession();
    }
  }, [clearLocalSession, isLoggingOut]);

  const value = useMemo<AuthContextValue>(() => ({ user, isLoggingOut, login, logout }), [isLoggingOut, login, logout, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
