import { isFirebaseConfigured } from '@/lib/firebase/config';
import { auth } from '@/lib/firebase/config';

export interface LessonProgress {
  courseId: string;
  moduleId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export interface ModuleProgress {
  courseId: string;
  moduleId: string;
  completedLessons: number;
  totalLessons: number;
  progress: number; // 0-100
}

const PROGRESS_STORAGE_KEY = 'axen_learning_progress';
const DEMO_PROGRESS_KEY = 'axen_demo_progress';

// Get user ID for storage key
const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const currentUser = auth?.currentUser;
    return currentUser?.uid || null;
  } catch {
    return null;
  }
};

// Get storage key for current user
const getStorageKey = (): string => {
  const userId = getUserId();
  if (userId) {
    return `${PROGRESS_STORAGE_KEY}_${userId}`;
  }
  return DEMO_PROGRESS_KEY;
};

// Module definitions with lesson counts
const MODULE_LESSONS: Record<string, Record<string, number>> = {
  'aiml': {
    'python': 6,
    'machine-learning': 6,
    'deep-learning': 6,
    'mlops': 6,
  },
  'aiml-engineering': {
    'python': 6,
    'machine-learning': 6,
    'deep-learning': 6,
    'mlops': 6,
  },
};

export const learningProgressService = {
  // Save lesson completion
  async saveLessonProgress(
    courseId: string,
    moduleId: string,
    lessonId: string,
    completed: boolean
  ): Promise<void> {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      // Get existing progress
      const existingProgress = this.getStoredProgress();
      
      // Update or add lesson progress
      const progressKey = `${courseId}_${moduleId}_${lessonId}`;
      existingProgress[progressKey] = {
        courseId,
        moduleId,
        lessonId,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingProgress));

      // If Firebase is configured, also save to Firestore
      if (isFirebaseConfigured()) {
        try {
          const { initializeFirebase, db } = await import('@/lib/firebase/config');
          await initializeFirebase();
          
          if (db && auth?.currentUser) {
            const firestore = await import('firebase/firestore');
            const progressRef = firestore.doc(
              db,
              `users/${auth.currentUser.uid}/progress/${progressKey}`
            );
            await firestore.setDoc(progressRef, {
              courseId,
              moduleId,
              lessonId,
              completed,
              completedAt: completed ? firestore.serverTimestamp() : null,
              updatedAt: firestore.serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Failed to save progress to Firebase:', error);
          // Continue with localStorage only
        }
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  },

  // Get stored progress from localStorage
  getStoredProgress(): Record<string, LessonProgress> {
    if (typeof window === 'undefined') return {};
    
    const storageKey = getStorageKey();
    if (!storageKey) return {};

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  // Get progress for a specific module
  getModuleProgress(courseId: string, moduleId: string): ModuleProgress {
    const progress = this.getStoredProgress();
    const totalLessons = MODULE_LESSONS[courseId]?.[moduleId] || 6; // Default to 6 lessons
    
    let completedLessons = 0;
    
    // Count completed lessons for this module
    Object.values(progress).forEach((lessonProgress) => {
      if (
        lessonProgress.courseId === courseId &&
        lessonProgress.moduleId === moduleId &&
        lessonProgress.completed
      ) {
        completedLessons++;
      }
    });

    const progressPercent = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return {
      courseId,
      moduleId,
      completedLessons,
      totalLessons,
      progress: progressPercent,
    };
  },

  // Get progress for all modules in a course
  getAllModuleProgress(courseId: string): ModuleProgress[] {
    const modules = MODULE_LESSONS[courseId] || {};
    return Object.keys(modules).map((moduleId) =>
      this.getModuleProgress(courseId, moduleId)
    );
  },

  // Check if a specific lesson is completed
  isLessonCompleted(courseId: string, moduleId: string, lessonId: string): boolean {
    const progress = this.getStoredProgress();
    const progressKey = `${courseId}_${moduleId}_${lessonId}`;
    return progress[progressKey]?.completed || false;
  },

  // Get overall course progress
  getCourseProgress(courseId: string): number {
    const modules = MODULE_LESSONS[courseId] || {};
    const moduleIds = Object.keys(modules);
    
    if (moduleIds.length === 0) return 0;

    const totalProgress = moduleIds.reduce((sum, moduleId) => {
      const moduleProgress = this.getModuleProgress(courseId, moduleId);
      return sum + moduleProgress.progress;
    }, 0);

    return Math.round(totalProgress / moduleIds.length);
  },

  // Get progress data for dashboard charts
  getDashboardProgressData(courseId: string): { name: string; progress: number }[] {
    const modules = MODULE_LESSONS[courseId] || {};
    const moduleNames: Record<string, string> = {
      'python': 'Python',
      'machine-learning': courseId === 'ai-engineering' ? 'ML' : 'Machine Learning',
      'deep-learning': 'Deep Learning',
      'generative-ai': 'Generative AI',
      'mlops': 'MLOps',
    };

    return Object.keys(modules).map((moduleId) => {
      const moduleProgress = this.getModuleProgress(courseId, moduleId);
      return {
        name: moduleNames[moduleId] || moduleId,
        progress: moduleProgress.progress,
      };
    });
  },

  // Get completion status for pie chart
  getCompletionStatus(courseId: string): { name: string; value: number; color: string }[] {
    const modules = MODULE_LESSONS[courseId] || {};
    const moduleIds = Object.keys(modules);
    
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    moduleIds.forEach((moduleId) => {
      const moduleProgress = this.getModuleProgress(courseId, moduleId);
      if (moduleProgress.progress === 100) {
        completed++;
      } else if (moduleProgress.progress > 0) {
        inProgress++;
      } else {
        notStarted++;
      }
    });

    const total = moduleIds.length;
    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgressPercent = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const notStartedPercent = total > 0 ? Math.round((notStarted / total) * 100) : 0;

    return [
      { name: 'Completed', value: completedPercent, color: '#10b981' },
      { name: 'In Progress', value: inProgressPercent, color: '#3b82f6' },
      { name: 'Not Started', value: notStartedPercent, color: '#6b7280' },
    ];
  },
};

