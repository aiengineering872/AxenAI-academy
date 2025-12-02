'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { User } from '@/types';
import { isFirebaseConfigured } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  firebaseUser: any | null; // Firebase user or null
  loading: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUserState = useCallback(
    async (currentUser: any | null) => {
      if (!isFirebaseConfigured()) {
        setUser(null);
        setFirebaseUser(null);
        return;
      }

      if (!currentUser) {
        setUser(null);
        setFirebaseUser(null);
        return;
      }

      setFirebaseUser(currentUser);

      try {
        const { getUserProfile } = await import('@/lib/firebase/auth');

        const profile = await getUserProfile(currentUser.uid);
        const email = (currentUser.email || '').toLowerCase();
        const isEnvAdmin = email && ADMIN_EMAILS.includes(email);
        const firebaseDisplayName = (currentUser.displayName || '').trim();
        const emailDisplayName = currentUser.email ? currentUser.email.split('@')[0] : '';

        if (profile) {
          const role = isEnvAdmin ? 'admin' : profile.role;
          const profileDisplayName = (profile.displayName || '').trim();
          const resolvedDisplayName =
            firebaseDisplayName || profileDisplayName || emailDisplayName || 'Learner';

          if (isEnvAdmin && profile.role !== 'admin') {
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const firebaseConfigModule = await import('@/lib/firebase/config');
              await firebaseConfigModule.initializeFirebase();
              if (firebaseConfigModule.db) {
                await updateDoc(doc(firebaseConfigModule.db, 'users', currentUser.uid), {
                  role: 'admin',
                  updatedAt: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error('Failed to promote user to admin:', error);
            }
          }

          if (profileDisplayName !== resolvedDisplayName) {
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const firebaseConfigModule = await import('@/lib/firebase/config');
              await firebaseConfigModule.initializeFirebase();
              if (firebaseConfigModule.db) {
                await updateDoc(doc(firebaseConfigModule.db, 'users', currentUser.uid), {
                  displayName: resolvedDisplayName,
                  updatedAt: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error('Failed to backfill user display name:', error);
            }
          }

          setUser({
            uid: profile.uid,
            email: profile.email,
            displayName: resolvedDisplayName,
            photoURL: profile.photoURL,
            role,
            xp: profile.xp,
            level: profile.level,
            badges: profile.badges,
          });
          return;
        }

        // Create profile if missing
        try {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const firebaseConfigModule = await import('@/lib/firebase/config');
          await firebaseConfigModule.initializeFirebase();

          const role = isEnvAdmin ? 'admin' : 'student';
          const resolvedDisplayName =
            firebaseDisplayName || emailDisplayName || 'Learner';

          if (firebaseConfigModule.db) {
            await setDoc(doc(firebaseConfigModule.db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: resolvedDisplayName,
              photoURL: currentUser.photoURL || null,
              role,
              xp: 0,
              level: 1,
              badges: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          setUser({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: resolvedDisplayName,
            photoURL: currentUser.photoURL || undefined,
            role,
            xp: 0,
            level: 1,
            badges: [],
          });
        } catch (error) {
          console.error('Failed to create user profile:', error);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setUser(null);
        setFirebaseUser(null);
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
        return;
      }

      const { getCurrentUser } = await import('@/lib/firebase/auth');
      const currentUser = await getCurrentUser();
      await hydrateUserState(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setFirebaseUser(null);
    } finally {
      setLoading(false);
    }
  }, [hydrateUserState]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const subscribeToAuthChanges = async () => {
      if (!isFirebaseConfigured()) {
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
        return;
      }

      try {
        const firebaseConfigModule = await import('@/lib/firebase/config');
        const firebaseAuth = await import('firebase/auth');

        await firebaseConfigModule.initializeFirebase();

        const authInstance = firebaseConfigModule.auth;

        if (!authInstance) {
          setLoading(false);
          return;
        }

        unsubscribe = firebaseAuth.onAuthStateChanged(authInstance, async (currentUser) => {
          try {
            await hydrateUserState(currentUser);
          } finally {
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error subscribing to auth changes:', error);
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    };

    void subscribeToAuthChanges();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [hydrateUserState]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

