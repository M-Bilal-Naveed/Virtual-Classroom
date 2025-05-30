
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  avatar?: string;
  createdAt: Date;
  lastLogin: Date;
}

class AuthService {
  async signUp(email: string, password: string, name: string, role: 'admin' | 'student'): Promise<void> {
    try {
      // Validate inputs
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      console.log('Starting signup process...', { email, name, role });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      console.log('User created successfully:', data.user.id);
      
      // If user is immediately confirmed, they can login right away
      if (data.user.email_confirmed_at) {
        console.log('User email already confirmed');
      } else {
        console.log('Please check your email to confirm your account');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }

      if (!password.trim()) {
        throw new Error('Password is required');
      }

      console.log('Starting signin process...', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase signin error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      console.log('User signed in successfully:', data.user.id);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return {
        id: profile.id,
        email: session.user.email!,
        name: profile.name,
        role: profile.role as 'admin' | 'student',
        avatar: profile.avatar,
        createdAt: new Date(profile.created_at),
        lastLogin: new Date()
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
