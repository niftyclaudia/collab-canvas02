import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import { CURSOR_COLORS } from '../utils/constants';

// User interface for our app
export interface User {
  uid: string;
  email: string;
  username: string;
  cursorColor: string;
  createdAt: Timestamp;
}

// Get random cursor color from palette
const getRandomCursorColor = (): string => {
  const randomIndex = Math.floor(Math.random() * CURSOR_COLORS.length);
  return CURSOR_COLORS[randomIndex];
};

// AuthService class with all auth operations
class AuthService {
  
  /**
   * Sign up a new user with email, password, and username
   */
  async signup(email: string, password: string, username: string): Promise<User> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const userData: Omit<User, 'uid'> = {
        email: firebaseUser.email!,
        username: username.trim(),
        cursorColor: getRandomCursorColor(),
        createdAt: serverTimestamp() as Timestamp,
      };

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userDocRef, userData);

      console.log('✅ User signed up successfully:', firebaseUser.uid);

      return {
        uid: firebaseUser.uid,
        ...userData,
      } as User;
    } catch (error) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  }

  /**
   * Login existing user with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found in database');
      }

      const userData = userDoc.data() as Omit<User, 'uid'>;
      
      console.log('✅ User logged in successfully:', firebaseUser.uid);

      return {
        uid: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Get current user data from Firestore
   */
  async getCurrentUserData(): Promise<User | null> {
    const firebaseUser = this.getCurrentUser();
    if (!firebaseUser) {
      return null;
    }

    try {
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn('⚠️ User document not found for authenticated user');
        return null;
      }

      const userData = userDoc.data() as Omit<User, 'uid'>;
      return {
        uid: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get full user data
        try {
          const userData = await this.getCurrentUserData();
          callback(userData);
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          callback(null);
        }
      } else {
        // User is signed out
        callback(null);
      }
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
