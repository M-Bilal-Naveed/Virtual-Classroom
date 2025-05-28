
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserProfile } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'admin' | 'student') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session
    const currentUser = localStorage.getItem('virtualClassroom_currentUser');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (error) {
        console.error('Error loading user session:', error);
        localStorage.removeItem('virtualClassroom_currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userProfile = await authService.signIn(email, password);
      setUser(userProfile);
      localStorage.setItem('virtualClassroom_currentUser', JSON.stringify(userProfile));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'student') => {
    setLoading(true);
    try {
      const userProfile = await authService.signUp(email, password, name, role);
      setUser(userProfile);
      localStorage.setItem('virtualClassroom_currentUser', JSON.stringify(userProfile));
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      localStorage.removeItem('virtualClassroom_currentUser');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
