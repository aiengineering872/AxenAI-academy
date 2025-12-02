'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { activityService } from '@/lib/services/activityService';

const FLUSH_INTERVAL = 60_000; // 1 minute
const MIN_SECONDS_TO_RECORD = 5;

export function UserActivityTracker() {
  const { user, loading } = useAuth();
  const lastTimestampRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const isActiveRef = useRef<boolean>(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      // If user logs out, flush any accumulated time.
      if (!user) {
        void flushActivity(accumulatedMsRef.current, currentUserIdRef.current);
        accumulatedMsRef.current = 0;
        currentUserIdRef.current = null;
      }
      return;
    }

    currentUserIdRef.current = user.uid;
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        lastTimestampRef.current = now;
        isActiveRef.current = true;
      } else {
        if (isActiveRef.current && lastTimestampRef.current) {
          accumulatedMsRef.current += now - lastTimestampRef.current;
        }
        isActiveRef.current = false;
        lastTimestampRef.current = null;
      }
    };

    const handleBeforeUnload = () => {
      if (!currentUserIdRef.current) return;
      const now = Date.now();
      if (isActiveRef.current && lastTimestampRef.current) {
        accumulatedMsRef.current += now - lastTimestampRef.current;
        lastTimestampRef.current = now;
      }
      void flushActivity(accumulatedMsRef.current, currentUserIdRef.current, true);
    };

    const startTracking = () => {
      lastTimestampRef.current = Date.now();
      isActiveRef.current = document.visibilityState === 'visible';
    };

    startTracking();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const interval = window.setInterval(() => {
      if (!currentUserIdRef.current) return;
      const now = Date.now();
      if (isActiveRef.current && lastTimestampRef.current) {
        accumulatedMsRef.current += now - lastTimestampRef.current;
        lastTimestampRef.current = now;
      }
      void flushActivity(accumulatedMsRef.current, currentUserIdRef.current);
      accumulatedMsRef.current = 0;
      lastTimestampRef.current = Date.now();
    }, FLUSH_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.clearInterval(interval);
      if (currentUserIdRef.current) {
        const now = Date.now();
        if (isActiveRef.current && lastTimestampRef.current) {
          accumulatedMsRef.current += now - lastTimestampRef.current;
        }
        void flushActivity(accumulatedMsRef.current, currentUserIdRef.current, true);
      }
      accumulatedMsRef.current = 0;
      lastTimestampRef.current = null;
      isActiveRef.current = false;
    };
  }, [user, loading]);

  return null;
}

async function flushActivity(milliseconds: number, userId: string | null, immediate = false) {
  if (!userId) {
    return;
  }
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < MIN_SECONDS_TO_RECORD && !immediate) {
    return;
  }
  if (seconds <= 0) {
    return;
  }

  try {
    await activityService.addActivitySeconds(userId, seconds);
  } catch (error) {
    console.error('Failed to record user activity:', error);
  }
}

