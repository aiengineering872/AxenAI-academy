import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';
import { initializeFirebase, db } from '@/lib/firebase/config';

const ensureFirebase = async () => {
  await initializeFirebase();
  if (!db) {
    throw new Error('Firebase not initialized');
  }
};

const mapProject = (docSnap: any) => {
  const data = docSnap.data();
  let createdAt: string | null = null;
  if (data.createdAt?.toDate) {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    createdAt = data.createdAt;
  }

  return {
    id: docSnap.id,
    ...data,
    createdAt,
  } as Record<string, any>;
};

export const projectService = {
  async listProjects() {
    await ensureFirebase();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(mapProject);
  },

  async createProject(projectData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      isPublic: true,
      tags: projectData.tags ?? [],
      upvotes: projectData.upvotes ?? 0,
      comments: projectData.comments ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async incrementUpvotes(projectId: string, delta = 1) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      upvotes: increment(delta),
      updatedAt: serverTimestamp(),
    });
  },

  async updateProject(projectId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Comment functions
  async addComment(projectId: string, commentData: { userId: string; userName: string; userPhoto?: string; text: string }) {
    await ensureFirebase();
    
    // Filter out undefined values - Firestore doesn't accept undefined
    const commentPayload: Record<string, any> = {
      userId: commentData.userId,
      userName: commentData.userName,
      text: commentData.text,
      createdAt: serverTimestamp(),
    };
    
    // Only include userPhoto if it has a value
    if (commentData.userPhoto) {
      commentPayload.userPhoto = commentData.userPhoto;
    }
    
    const commentRef = await addDoc(collection(db, 'projects', projectId, 'comments'), commentPayload);
    
    // Update comment count
    await updateDoc(doc(db, 'projects', projectId), {
      comments: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    return commentRef.id;
  },

  async getComments(projectId: string) {
    await ensureFirebase();
    const snapshot = await getDocs(
      query(collection(db, 'projects', projectId, 'comments'), orderBy('createdAt', 'asc'))
    );
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let createdAt: string | null = null;
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAt = data.createdAt;
      }
      return {
        id: docSnap.id,
        ...data,
        createdAt,
      };
    });
  },

  async deleteComment(projectId: string, commentId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'projects', projectId, 'comments', commentId));
    
    // Update comment count
    await updateDoc(doc(db, 'projects', projectId), {
      comments: increment(-1),
      updatedAt: serverTimestamp(),
    });
  },

  // Real-time comment listener
  subscribeToComments(projectId: string, callback: (comments: any[]) => void) {
    if (!db) {
      initializeFirebase().then(() => {
        if (db) {
          const q = query(collection(db, 'projects', projectId, 'comments'), orderBy('createdAt', 'asc'));
          return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              let createdAt: string | null = null;
              if (data.createdAt?.toDate) {
                createdAt = data.createdAt.toDate().toISOString();
              } else if (typeof data.createdAt === 'string') {
                createdAt = data.createdAt;
              }
              return {
                id: docSnap.id,
                ...data,
                createdAt,
              };
            });
            callback(comments);
          });
        }
      });
      return () => {};
    }
    
    const q = query(collection(db, 'projects', projectId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let createdAt: string | null = null;
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAt = data.createdAt;
        }
        return {
          id: docSnap.id,
          ...data,
          createdAt,
        };
      });
      callback(comments);
    });
  },

  // Upvote with user tracking
  async toggleUpvote(projectId: string, userId: string) {
    await ensureFirebase();
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectDoc.data();
    const upvotedUsers = projectData.upvotedUsers || [];
    const hasUpvoted = upvotedUsers.includes(userId);
    
    if (hasUpvoted) {
      // Remove upvote
      await updateDoc(projectRef, {
        upvotedUsers: arrayRemove(userId),
        upvotes: increment(-1),
        updatedAt: serverTimestamp(),
      });
      return false;
    } else {
      // Add upvote
      await updateDoc(projectRef, {
        upvotedUsers: arrayUnion(userId),
        upvotes: increment(1),
        updatedAt: serverTimestamp(),
      });
      return true;
    }
  },

  // Real-time project listener
  subscribeToProjects(callback: (projects: any[]) => void) {
    if (!db) {
      initializeFirebase().then(() => {
        if (db) {
          const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
          return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(mapProject);
            callback(projects);
          });
        }
      });
      return () => {};
    }
    
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(mapProject);
      callback(projects);
    });
  },
};

export type ProjectService = typeof projectService;
