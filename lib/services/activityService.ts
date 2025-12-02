'use client';

import { initializeFirebase, db } from '@/lib/firebase/config';

const ensureFirebase = async () => {
  await initializeFirebase();
  if (!db) {
    throw new Error('Firebase not initialized');
  }
};

export const activityService = {
  async addActivitySeconds(userId: string, seconds: number) {
    if (!seconds || seconds <= 0) {
      return;
    }

    await ensureFirebase();

    const { doc, updateDoc, serverTimestamp, increment, setDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    try {
      await updateDoc(userRef, {
        [`activityLog.${dateKey}`]: increment(seconds),
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      await setDoc(
        userRef,
        {
          activityLog: { [dateKey]: seconds },
          lastActiveAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  },
};

export type ActivityService = typeof activityService;

