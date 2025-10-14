import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
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

// Debug information
console.log('🔥 Firebase Configuration Debug Info:');
console.log('📊 Environment mode:', import.meta.env.MODE);
console.log('🌐 Hostname:', window.location.hostname);
console.log('🔗 Database URL:', import.meta.env.VITE_FIREBASE_DATABASE_URL);
console.log('🏗️ Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('🔑 Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

// Test Realtime Database connection in production
if (import.meta.env.MODE === 'production') {
  setTimeout(async () => {
    try {
      const { ref, get } = await import('firebase/database');
      // Test with a simple path instead of .info/connected
      const testRef = ref(database, 'test');
      const snapshot = await get(testRef);
      console.log('🔗 Realtime Database connection test: SUCCESS - Can read from RTDB');
      console.log('🔗 Test data:', snapshot.val());
    } catch (error) {
      console.error('❌ Realtime Database connection test failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  }, 2000);
}

// Connect to emulators in development mode
if (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost') {
  try {
    // Connect to Firebase Emulators
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectDatabaseEmulator(database, 'localhost', 9000);
    
    console.log('🔥 Connected to Firebase Emulators');
  } catch (error) {
    console.log('Firebase emulators already connected or connection failed:', error);
  }
}

export default app;
