import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type User } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    streetAddress?: string;
    neighborhoodId?: string;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    streetAddress?: string;
    neighborhoodId?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = localStorage.getItem("nn_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("nn_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    localStorage.setItem("nn_token", res.data.token);
    setUser(res.data.user);
  }

  async function register(data: {
    name: string;
    email: string;
    password: string;
    streetAddress?: string;
    neighborhoodId?: string;
  }) {
    const res = await api.post<{ token: string; user: User }>("/auth/register", data);
    localStorage.setItem("nn_token", res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("nn_token");
    setUser(null);
  }

  async function updateProfile(data: {
    name?: string;
    streetAddress?: string;
    neighborhoodId?: string;
  }) {
    const res = await api.patch<{ user: User }>("/auth/me", data);
    setUser(res.data.user);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
