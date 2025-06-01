
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authService, UserProfile } from '../services/authService';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'admin' | 'student') => Promise<void>;
  logout: () => Promise<void>;
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
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile with a small delay to avoid issues
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profile) {
                const userProfile: UserProfile = {
                  id: profile.id,
                  email: session.user.email!,
                  name: profile.name,
                  role: profile.role as 'admin' | 'student',
                  avatar: profile.avatar,
                  createdAt: new Date(profile.created_at),
                  lastLogin: new Date()
                };
                console.log('User profile loaded:', userProfile);
                setUser(userProfile);
              }
            } catch (error) {
              console.error('Error loading profile:', error);
              setUser(null);
            }
            setLoading(false);
          }, 100);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email, error);
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }
        
        if (!session) {
          setLoading(false);
        }
        // If session exists, the onAuthStateChange will handle it
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      // Don't set loading to false here, let onAuthStateChange handle it
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'student') => {
    setLoading(true);
    try {
      await authService.signUp(email, password, name, role);
    } finally {
      // Don't set loading to false here, let onAuthStateChange handle it
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
