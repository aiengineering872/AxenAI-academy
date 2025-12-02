import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  return Boolean(
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId &&
    !`${apiKey}`.includes('your') &&
    !`${projectId}`.includes('your')
  );
};

// Initialize Firebase only if configured
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured()) {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    };

    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    // Set auth persistence (only in browser)
    if (typeof window !== 'undefined' && auth) {
      auth.setPersistence(browserLocalPersistence).catch((error: any) => {
        console.error('Failed to set auth persistence:', error);
      });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Continue without Firebase (demo mode)
  }
}

// Backward compatibility: initializeFirebase function (now a no-op since we initialize immediately)
export const initializeFirebase = async () => {
  // Already initialized at module load, just verify
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set the required environment variables.');
  }
  if (!db || !auth) {
    throw new Error('Firebase initialization failed.');
  }
};

export { auth, db, storage };
export default app;
