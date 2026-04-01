import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import { API_BASE } from '../config';
import { Role, AuthUser } from '../types';


type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  adminModeUnlocked: boolean;
  setAdminModeUnlocked: Dispatch<SetStateAction<boolean>>;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  refreshUser: () => Promise<AuthUser | null>;
};



const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  adminModeUnlocked: false,
  setAdminModeUnlocked: () => {},
  login: () => {},
  logout: () => {},
  setUser: () => {},
  refreshUser: async () => null,
});



export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminModeUnlocked, setAdminModeUnlocked] = useState(false);

  // Load from localStorage on first mount
  useEffect(() => {
    const storedUser = localStorage.getItem('atmos_user');
    const storedToken = localStorage.getItem('atmos_token');
    const storedAdminMode = localStorage.getItem('atmos_admin_mode');

    if (storedUser && storedToken) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        const normalizedUser: AuthUser = {
          ...parsedUser,
          role: parsedUser.role.toLowerCase() as Role,
        };
        setUser(normalizedUser);
        setToken(storedToken);

        // Only restore admin mode when a valid session also exists
        if (storedAdminMode === 'true') {
          setAdminModeUnlocked(true);
        }
      } catch {
        localStorage.removeItem('atmos_user');
        localStorage.removeItem('atmos_token');
        localStorage.removeItem('atmos_admin_mode');
      }
    } else {
      // No valid session — clear any stale admin mode flag
      localStorage.removeItem('atmos_admin_mode');
    }
  }, []);

  const login = (u: AuthUser, t: string) => {
    const normalizedUser: AuthUser = {
      ...u,
      role: u.role.toLowerCase() as Role, // normalize role
    };

    setUser(normalizedUser);
    setToken(t);

    localStorage.setItem('atmos_user', JSON.stringify(normalizedUser));
    localStorage.setItem('atmos_token', t);

    // reset admin mode on new login
    setAdminModeUnlocked(false);
    localStorage.removeItem('atmos_admin_mode');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAdminModeUnlocked(false);
    localStorage.removeItem('atmos_user');
    localStorage.removeItem('atmos_token');
    localStorage.removeItem('atmos_admin_mode');
  };

  // Persist adminModeUnlocked when it changes (and re-normalize role)
  useEffect(() => {
    const storedUser = localStorage.getItem('atmos_user');
    const storedToken = localStorage.getItem('atmos_token');
    const storedAdminMode = localStorage.getItem('atmos_admin_mode');

    if (storedUser && storedToken) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);

        const normalizedUser: AuthUser = {
          ...parsedUser,
          role: parsedUser.role.toLowerCase() as Role,
        };

        setUser(normalizedUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('atmos_user');
        localStorage.removeItem('atmos_token');
      }
    }

    if (storedAdminMode === 'true') {
      setAdminModeUnlocked(true);
    }
  }, []);

  // Call this right after /api/auth/verify-email succeeds
  // Call this after /api/auth/verify-email or when you need fresh claims
const refreshUser = async (): Promise<AuthUser | null> => {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        logout();
      }
      return null;
    }

    const data: { ok: boolean; token: string; user: AuthUser } = await res.json();
    if (!data.ok) return null;

    const updatedUser: AuthUser = {
      ...data.user,
      role: data.user.role.toLowerCase() as Role,
    };

    setUser(updatedUser);
    setToken(data.token);

    localStorage.setItem('atmos_user', JSON.stringify(updatedUser));
    localStorage.setItem('atmos_token', data.token);

    return updatedUser;
  } catch (err) {
    console.error('Error refreshing user/token:', err);
    return null;
  }
};


  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    adminModeUnlocked,
    setAdminModeUnlocked,
    login,
    logout,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
