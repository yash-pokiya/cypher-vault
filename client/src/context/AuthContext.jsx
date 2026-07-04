import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../api/auth.api';
import { profileAPI } from '../api/profile.api';
import { setAccessToken, clearAccessToken } from '../api/axios.instance';
import { clearAllBlobs } from '../cache/blobCache';
import { clearAllMeta } from '../cache/metadataCache';
import { clearMasterKey } from '../crypto/keyStorage';
import { clearVaultSession } from '../crypto/vaultSession';

const AuthContext = createContext(null);

const USER_KEY = 'vault_user'; // stores { id, name, email, vaultPasswordSet }

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persist = (u) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const updateUser = useCallback((fields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clear = () => {
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // Sync vaultPasswordSet status from backend on mount if user is logged in
  useEffect(() => {
    if (user) {
      profileAPI
        .getVaultStatus()
        .then((res) => {
          if (res && typeof res.vaultPasswordSet === 'boolean') {
            updateUser({ vaultPasswordSet: res.vaultPasswordSet });
          }
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            clearVaultSession();
            clearMasterKey();
            clearAllBlobs();
            clearAllMeta();
            clearAccessToken();
            clear();
          }
        });
    }
  }, []);

  // Listen for global auth logout event (triggered by 401 refresh failure)
  useEffect(() => {
    const handleAuthLogout = () => {
      clearVaultSession();
      clearMasterKey();
      clearAllBlobs();
      clearAllMeta();
      clearAccessToken();
      clear();
    };

    window.addEventListener('vault_auth_logout', handleAuthLogout);
    return () => window.removeEventListener('vault_auth_logout', handleAuthLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      setAccessToken(data.data.accessToken);
      persist(data.data.user);
      return data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password });
      setAccessToken(data.data.accessToken);
      persist(data.data.user);
      return data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      /* best effort */
    }
    clearVaultSession();
    clearMasterKey();
    clearAllBlobs();
    clearAllMeta();
    clearAccessToken();
    clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
};
