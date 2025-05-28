
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';

// Firebase configuration - you'll need to get these from Firebase Console
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
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
  async signUp(email: string, password: string, name: string, role: 'admin' | 'student'): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userProfile: UserProfile = {
        id: user.uid,
        email,
        name,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      return userProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userProfile = { ...userDoc.data(), id: user.uid } as UserProfile;
      
      // Update last login
      await setDoc(doc(db, 'users', user.uid), { 
        ...userProfile, 
        lastLogin: new Date() 
      });
      
      return userProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  async recordAttendance(userId: string, classId: string, userName: string): Promise<void> {
    try {
      await addDoc(collection(db, 'attendance'), {
        userId,
        classId,
        userName,
        timestamp: new Date(),
        status: 'present'
      });
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  }
}

export const authService = new AuthService();
