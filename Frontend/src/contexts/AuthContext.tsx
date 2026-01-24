import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

type Role = 'admin' | 'operator' | 'viewer';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  lastLogin?: string;
};

type MeResponse = {
  ok: boolean;
  user?: AuthUser;
  error?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  refreshUser: () => Promise<void>;
};

const API_BASE = 'http://localhost:5000';

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  setUser: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load from localStorage on first mount
  useEffect(() => {
    const storedUser = localStorage.getItem('atmos_user');
    const storedToken = localStorage.getItem('atmos_token');
    if (storedUser && storedToken) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('atmos_user');
        localStorage.removeItem('atmos_token');
      }
    }
  }, []);

  const login = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('atmos_user', JSON.stringify(u));
    localStorage.setItem('atmos_token', t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('atmos_user');
    localStorage.removeItem('atmos_token');
  };

  // Call this right after /api/auth/verify-email succeeds
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
        }
        return;
      }

      const data: MeResponse = await res.json();
      if (data.ok && data.user) {
        const updatedUser: AuthUser = data.user;
        setUser(updatedUser);
        localStorage.setItem('atmos_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
