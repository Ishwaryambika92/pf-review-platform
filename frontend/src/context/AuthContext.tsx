import { createContext, useContext, useEffect, useState } from "react";
import { getAccessToken } from "../api/client";
import * as api from "../api/endpoints";
import type { MyUser } from "../api/types";

interface AuthState {
  user: MyUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (getAccessToken()) {
        try {
          setUser(await api.me());
        } catch {
          api.logout();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const u = await api.login(username, password);
      setUser(u);
    } catch (e: any) {
      setError(e?.body?.detail || "Invalid username or password.");
      throw e;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setError(null);
    try {
      await api.register(username, email, password);
      await login(username, password);
    } catch (e: any) {
      const body = e?.body;
      const msg = body && typeof body === "object" ? Object.values(body).flat().join(" ") : "Registration failed.";
      setError(msg);
      throw e;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
