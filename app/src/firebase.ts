import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Debug information
console.log('🔥 Firebase Configuration Debug Info:');
console.log('📊 Environment mode:', import.meta.env.MODE);
console.log('🌐 Hostname:', window.location.hostname);
console.log('🔑 Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('📦 Firestore App Name:', app.name);
console.log('🔥 Firestore Type:', firestore.type);

// Check if we should use emulators (respecting VITE_USE_EMULATORS env var)
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
const isEmulator = useEmulators && (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost');
console.log('🎯 Using Firebase Emulators:', isEmulator);
console.log('🎯 Firestore Collection Path: canvases/main/shapes');

// Production connection confirmed
if (!isEmulator) {
  console.log('✅ Production Firebase initialized successfully');
  console.log('✅ Realtime Database URL:', import.meta.env.VITE_FIREBASE_DATABASE_URL);
}

// Connect to emulators only if VITE_USE_EMULATORS=true
if (useEmulators && (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost')) {
  try {
    // Connect to Firebase Emulators
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectDatabaseEmulator(database, 'localhost', 9000);
    
    console.log('🔥 Connected to Firebase Emulators');
  } catch (error) {
    console.log('Firebase emulators already connected or connection failed:', error);
  }
} else {
  console.log('🔥 Connected to PRODUCTION Firebase');
}

export default app;
