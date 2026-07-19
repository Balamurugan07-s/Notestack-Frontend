import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  college?: string;
  course?: string;
  year?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; message?: string; previewUrl?: string; error?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<{ success: boolean; error?: string }>;
  gdprDeleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check login status on load (retrieve user profile if token exists)
  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/users/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.warn('Could not restore user profile, session may have expired.');
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    // Listen for session expiration events emitted by Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      alert('Your session has expired. Please log in again.');
      window.location.href = '/login';
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials or network error',
      };
    }
  };

  const register = async (userData: any) => {
    try {
      const res = await API.post('/auth/register', userData);
      return {
        success: true,
        message: res.data.message,
        previewUrl: res.data.previewUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed',
      };
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const res = await API.post('/auth/verify-email', { email, otp });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Verification failed',
      };
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      const res = await API.put('/users/me', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Update failed',
      };
    }
  };

  const gdprDeleteAccount = async () => {
    try {
      const res = await API.delete('/users/me');
      if (res.data.success) {
        localStorage.removeItem('token');
        setUser(null);
        return { success: true };
      }
      return { success: false, error: 'Purge failed' };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Purge failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        logout,
        updateProfile,
        gdprDeleteAccount,
        refreshProfile,
      }}
    >
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
