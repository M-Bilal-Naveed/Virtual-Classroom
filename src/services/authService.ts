
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
    console.log('Starting signup process...', { email, name, role });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          role
        }
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
  }

  async signIn(email: string, password: string): Promise<void> {
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
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    console.log('User signed out successfully');
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
