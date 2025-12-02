// Firebase auth functions - only loaded when Firebase is configured
import { isFirebaseConfigured } from './config';

export interface UserRole {
  role: 'student' | 'admin';
}

export interface UserProfile extends UserRole {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  level: number;
  badges: string[];
  createdAt: any;
  updatedAt: any;
}

// Dynamic imports - only load Firebase when needed
let firebaseAuthLoaded = false;
let signInWithPopup: any;
let GoogleAuthProvider: any;
let signOut: any;
let signInWithEmailAndPassword: any;
let createUserWithEmailAndPassword: any;
let onAuthStateChanged: any;

const loadFirebaseAuth = async () => {
  if (firebaseAuthLoaded || !isFirebaseConfigured()) return;
  
  try {
    const firebaseAuth = await import('firebase/auth');
    signInWithPopup = firebaseAuth.signInWithPopup;
    GoogleAuthProvider = firebaseAuth.GoogleAuthProvider;
    signOut = firebaseAuth.signOut;
    signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
    createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
    onAuthStateChanged = firebaseAuth.onAuthStateChanged;
    firebaseAuthLoaded = true;
  } catch (error) {
    console.warn('Firebase auth not available');
  }
};

let provider: any = null;

export const signInWithGoogle = async (): Promise<any> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set up your Firebase credentials.');
  }
  
  await loadFirebaseAuth();
  if (!signInWithPopup || !GoogleAuthProvider) {
    throw new Error('Firebase auth not available');
  }
  
  if (!provider) {
    provider = new GoogleAuthProvider();
  }
  
  const firebaseConfigModule = await import('./config');
  try {
    await firebaseConfigModule.initializeFirebase();
  } catch (error) {
    throw new Error('Firebase initialization failed. Please verify configuration.');
  }
  
  if (!firebaseConfigModule.auth) {
    throw new Error('Firebase auth not initialized');
  }
  
  const result = await signInWithPopup(firebaseConfigModule.auth, provider);
  const user = result.user;
  
  // Create or update user profile
  const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
  if (firebaseConfigModule.db) {
    const userRef = doc(firebaseConfigModule.db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'student',
        xp: 0,
        level: 1,
        badges: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
  
  return user;
};

export const signInWithEmail = async (email: string, password: string): Promise<any> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set up your Firebase credentials.');
  }
  
  await loadFirebaseAuth();
  if (!signInWithEmailAndPassword) {
    throw new Error('Firebase auth not available');
  }
  
  const firebaseConfigModule = await import('./config');
  try {
    await firebaseConfigModule.initializeFirebase();
  } catch (error) {
    throw new Error('Firebase initialization failed. Please verify configuration.');
  }
  
  if (!firebaseConfigModule.auth) {
    throw new Error('Firebase auth not initialized');
  }
  
  const result = await signInWithEmailAndPassword(firebaseConfigModule.auth, email, password);
  return result.user;
};

export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<any> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set up your Firebase credentials.');
  }
  
  await loadFirebaseAuth();
  if (!createUserWithEmailAndPassword) {
    throw new Error('Firebase auth not available');
  }
  
  const firebaseConfigModule = await import('./config');
  try {
    await firebaseConfigModule.initializeFirebase();
  } catch (error) {
    throw new Error('Firebase initialization failed. Please verify configuration.');
  }
  
  if (!firebaseConfigModule.auth) {
    throw new Error('Firebase not initialized');
  }
  
  const result = await createUserWithEmailAndPassword(firebaseConfigModule.auth, email, password);
  const user = result.user;
  
  // Create user profile
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  
  if (firebaseConfigModule.db) {
    const userRef = doc(firebaseConfigModule.db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      displayName,
      role: 'student',
      xp: 0,
      level: 1,
      badges: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  return user;
};

export const logout = async (): Promise<void> => {
  if (!isFirebaseConfigured()) {
    return;
  }
  
  await loadFirebaseAuth();
  if (!signOut) {
    return;
  }
  
  const firebaseConfigModule = await import('./config');
  try {
    await firebaseConfigModule.initializeFirebase();
  } catch (error) {
    console.error('Firebase initialization failed during logout:', error);
    return;
  }
  
  if (!firebaseConfigModule.auth) {
    return;
  }
  
  await signOut(firebaseConfigModule.auth);
};

export const getCurrentUser = async (): Promise<any | null> => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  
  await loadFirebaseAuth();
  if (!onAuthStateChanged) {
    return null;
  }
  
  const firebaseConfigModule = await import('./config');
  try {
    await firebaseConfigModule.initializeFirebase();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return null;
  }
  
  if (!firebaseConfigModule.auth) {
    return null;
  }
  
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseConfigModule.auth, (user: any) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  
  const { doc, getDoc } = await import('firebase/firestore');
  const firebaseConfigModule = await import('./config');
  try {
    await firebaseConfigModule.initializeFirebase();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return null;
  }
  
  if (!firebaseConfigModule.db) {
    return null;
  }
  
  const userRef = doc(firebaseConfigModule.db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as UserProfile;
  }
  
  return null;
};
