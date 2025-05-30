
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authService, UserProfile } from '../services/authService';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Get user profile from profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            const userProfile: UserProfile = {
              id: profile.id,
              email: session.user.email!,
              name: profile.name,
              role: profile.role as 'admin' | 'student',
              avatar: profile.avatar,
              createdAt: new Date(profile.created_at),
              lastLogin: new Date()
            };
            setUser(userProfile);
          } else {
            console.error('Failed to load profile:', error);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userProfile = await authService.signIn(email, password);
      // User state will be updated by the auth state listener
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      throw new Error(error.message);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'student') => {
    setLoading(true);
    try {
      const userProfile = await authService.signUp(email, password, name, role);
      // User state will be updated by the auth state listener
    } catch (error: any) {
      console.error('Signup error:', error);
      setLoading(false);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
