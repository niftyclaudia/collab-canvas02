import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, firestore, googleProvider } from '../firebase';
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
      console.log('🚨 LOGIN ATTEMPT - Updated auth service deployed!', { email });
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;


      // Get user data from Firestore
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.warn('⚠️ User document not found, creating it now for uid:', firebaseUser.uid);
        
        // Create missing user document (this can happen if user was created in emulator)
        const userData: Omit<User, 'uid'> = {
          email: firebaseUser.email!,
          username: firebaseUser.email!.split('@')[0], // Use email prefix as username
          cursorColor: getRandomCursorColor(),
          createdAt: serverTimestamp() as Timestamp,
        };

        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        await setDoc(userDocRef, userData);
        
        
        return {
          uid: firebaseUser.uid,
          ...userData,
        } as User;
      }

      const userData = userDoc.data() as Omit<User, 'uid'>;
      

      return {
        uid: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Login error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      console.log('🚨 GOOGLE SIGNIN ATTEMPT - Google auth service deployed!');
      
      // Sign in with Google using popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Extract Google user data
      const displayName = firebaseUser.displayName;
      const email = firebaseUser.email!;
      
      // Generate username from display name or email
      let username: string;
      if (displayName) {
        // Clean display name for username (remove special characters, limit length)
        username = displayName
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '') // Remove spaces
          .toLowerCase()
          .substring(0, 20); // Limit length
        
        // If username is empty after cleaning, fallback to email prefix
        if (!username) {
          username = email.split('@')[0].substring(0, 20);
        }
      } else {
        // Fallback to email prefix if no display name
        username = email.split('@')[0].substring(0, 20);
      }

      // Check if user document exists
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log('📝 Creating new user document for Google user');
        
        // Create new user document
        const userData: Omit<User, 'uid'> = {
          email: email,
          username: username,
          cursorColor: getRandomCursorColor(),
          createdAt: serverTimestamp() as Timestamp,
        };

        await setDoc(userDocRef, userData);
        
        return {
          uid: firebaseUser.uid,
          ...userData,
        } as User;
      } else {
        console.log('📝 User document exists, returning existing user data');
        
        // Return existing user data
        const userData = userDoc.data() as Omit<User, 'uid'>;
        return {
          uid: firebaseUser.uid,
          ...userData,
        };
      }
    } catch (error) {
      console.error('❌ Google signin error:', error);
      
      // Handle specific Google auth errors
      if (error instanceof Error) {
        if (error.message.includes('popup-closed-by-user')) {
          throw new Error('Google sign-in was cancelled. Please try again.');
        } else if (error.message.includes('popup-blocked')) {
          throw new Error('Popup was blocked. Please allow popups and try again.');
        } else if (error.message.includes('network-request-failed')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
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
