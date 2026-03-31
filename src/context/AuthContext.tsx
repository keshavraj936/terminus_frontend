import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api, { setAccessToken } from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  year: number;
  batch: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const res = await api.post('refresh.php');
        if (res.data.status === 'success') {
          const freshToken = res.data.data.token;
          setAccessToken(freshToken);
          setToken(freshToken);

          // Now fetch user details authentically using the newly loaded Access Token interceptor
          const profileRes = await api.get('profile.php');
          if (profileRes.data.status === 'success') {
            setUser(profileRes.data.data);
          }
        }
      } catch (err) {
        console.log("No valid session cookie detected on boot.");
      } finally {
        setLoading(false);
      }
    };
    hydrateSession();
  }, []);

  const login = (userData: User, authToken: string) => {
    setAccessToken(authToken);
    setUser(userData);
    setToken(authToken);
    // Erase any legacy lingering local storage for maximum security
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const logout = async () => {
    try {
      await api.post('logout.php');
    } catch(e) {}
    setAccessToken('');
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Decrypting secure session...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
