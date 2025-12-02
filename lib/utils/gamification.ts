import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
}

export const badges: Badge[] = [
  { id: 'first-lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', requirement: 1 },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Complete 7 days of learning', icon: '🔥', requirement: 7 },
  { id: 'project-master', name: 'Project Master', description: 'Submit 5 projects', icon: '🚀', requirement: 5 },
  { id: 'quiz-champion', name: 'Quiz Champion', description: 'Score 100% on 10 quizzes', icon: '🏆', requirement: 10 },
  { id: 'xp-legend', name: 'XP Legend', description: 'Reach 10,000 XP', icon: '⭐', requirement: 10000 },
];

export const calculateLevel = (xp: number): number => {
  // Level formula: level = sqrt(xp / 100)
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXPForLevel = (level: number): number => {
  return Math.pow(level - 1, 2) * 100;
};

export const awardXP = async (userId: string, amount: number, reason: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentXP = userSnap.data().xp || 0;
      const newXP = currentXP + amount;
      const newLevel = calculateLevel(newXP);
      
      await updateDoc(userRef, {
        xp: increment(amount),
        level: newLevel,
        updatedAt: new Date(),
      });

      // Check for badge unlocks
      await checkBadgeUnlocks(userId, newXP);
    }
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
};

export const checkBadgeUnlocks = async (userId: string, xp: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userBadges = userSnap.data().badges || [];
      const unlockedBadges: string[] = [];

      for (const badge of badges) {
        if (!userBadges.includes(badge.id)) {
          // Check if requirement is met
          if (xp >= badge.requirement) {
            unlockedBadges.push(badge.id);
          }
        }
      }

      if (unlockedBadges.length > 0) {
        await updateDoc(userRef, {
          badges: [...userBadges, ...unlockedBadges],
        });
      }
    }
  } catch (error) {
    console.error('Error checking badge unlocks:', error);
  }
};

export const getProgressToNextLevel = (xp: number, level: number): { current: number; required: number; percentage: number } => {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const current = xp - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  const percentage = Math.min((current / required) * 100, 100);

  return { current, required, percentage };
};

