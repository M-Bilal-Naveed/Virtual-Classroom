
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';

// Demo Firebase configuration - works for development
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project-id",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
  // Demo users for testing
  private demoUsers: UserProfile[] = [
    {
      id: 'demo-admin',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@test.com',
      createdAt: new Date(),
      lastLogin: new Date()
    }
  ];

  async signUp(email: string, password: string, name: string, role: 'admin' | 'student'): Promise<UserProfile> {
    try {
      // Check if it's a demo login
      if (email === 'admin@test.com') {
        return this.demoUsers[0];
      }

      // For demo purposes, create a mock user profile
      const userProfile: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      // Store in localStorage for persistence
      const users = JSON.parse(localStorage.getItem('virtualClassroom_users') || '[]');
      users.push(userProfile);
      localStorage.setItem('virtualClassroom_users', JSON.stringify(users));
      
      return userProfile;
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      // Check for demo admin login
      if (email === 'admin@test.com') {
        return this.demoUsers[0];
      }

      // Check localStorage for existing users
      const users = JSON.parse(localStorage.getItem('virtualClassroom_users') || '[]');
      const user = users.find((u: UserProfile) => u.email === email);
      
      if (!user) {
        throw new Error('User not found. Please sign up first.');
      }
      
      // Update last login
      user.lastLogin = new Date();
      const updatedUsers = users.map((u: UserProfile) => u.email === email ? user : u);
      localStorage.setItem('virtualClassroom_users', JSON.stringify(updatedUsers));
      
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async signOut(): Promise<void> {
    // Clear current user session
    localStorage.removeItem('virtualClassroom_currentUser');
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
      
      // Store in localStorage
      const attendanceRecords = JSON.parse(localStorage.getItem('virtualClassroom_attendance') || '[]');
      attendanceRecords.push(attendance);
      localStorage.setItem('virtualClassroom_attendance', JSON.stringify(attendanceRecords));
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  }
}

export const authService = new AuthService();
