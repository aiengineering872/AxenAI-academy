// Demo authentication system (no Firebase required)
import { User } from '@/types';

const DEMO_USER_KEY = 'axen_demo_user';
const DEMO_SESSION_KEY = 'axen_demo_session';

export interface DemoUser extends User {
  password?: string; // Only stored in demo mode
}

export const demoAuth = {
  // Sign up with demo storage
  signUp: async (email: string, password: string, displayName: string): Promise<DemoUser> => {
    const users = getStoredUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: DemoUser = {
      uid: `demo_${Date.now()}`,
      email,
      displayName,
      role: 'student',
      xp: 0,
      level: 1,
      badges: [],
      password, // Store password in demo mode only
    };

    users.push(newUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(users));
    
    // Set current session
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(newUser));
    
    return newUser;
  },

  // Sign in with demo storage
  signIn: async (email: string, password: string): Promise<DemoUser> => {
    const users = getStoredUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    // Set current session
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(userWithoutPassword));
    
    return userWithoutPassword as DemoUser;
  },

  // Google sign in (demo mode - just creates/updates user)
  signInWithGoogle: async (): Promise<DemoUser> => {
    const mockUser: DemoUser = {
      uid: `demo_google_${Date.now()}`,
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: 'https://ui-avatars.com/api/?name=Demo+User',
      role: 'student',
      xp: 0,
      level: 1,
      badges: [],
    };

    const users = getStoredUsers();
    const existingUser = users.find(u => u.email === mockUser.email);
    
    if (!existingUser) {
      users.push(mockUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(users));
    }

    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(mockUser));
    
    return mockUser;
  },

  // Get current user
  getCurrentUser: (): DemoUser | null => {
    if (typeof window === 'undefined') return null;
    
    const session = localStorage.getItem(DEMO_SESSION_KEY);
    if (!session) return null;
    
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    localStorage.removeItem(DEMO_SESSION_KEY);
  },

  // Update user
  updateUser: (updates: Partial<DemoUser>): DemoUser | null => {
    const currentUser = demoAuth.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(updatedUser));
    
    // Update in users list
    const users = getStoredUsers();
    const index = users.findIndex(u => u.uid === currentUser.uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(users));
    }
    
    return updatedUser;
  },
};

function getStoredUsers(): DemoUser[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(DEMO_USER_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

