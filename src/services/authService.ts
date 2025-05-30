
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
  async signUp(email: string, password: string, name: string, role: 'admin' | 'student'): Promise<UserProfile> {
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

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name.trim(),
            role
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      // Return user profile data
      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email!,
        name: name.trim(),
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      return userProfile;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }

      if (!password.trim()) {
        throw new Error('Password is required');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to load user profile');
      }

      const userProfile: UserProfile = {
        id: profile.id,
        email: data.user.email!,
        name: profile.name,
        role: profile.role as 'admin' | 'student',
        avatar: profile.avatar,
        createdAt: new Date(profile.created_at),
        lastLogin: new Date()
      };

      return userProfile;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async recordAttendance(userId: string, classId: string, userName: string): Promise<void> {
    try {
      const attendance = {
        userId,
        classId,
        userName,
        timestamp: new Date(),
        status: 'present'
      };
      
      // Store in localStorage for now (can be moved to Supabase later)
      const attendanceRecords = JSON.parse(localStorage.getItem('virtualClassroom_attendance') || '[]');
      attendanceRecords.push(attendance);
      localStorage.setItem('virtualClassroom_attendance', JSON.stringify(attendanceRecords));
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  }
}

export const authService = new AuthService();
