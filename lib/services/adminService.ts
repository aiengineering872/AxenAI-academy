import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebase, db } from '@/lib/firebase/config';

const ensureFirebase = async (): Promise<boolean> => {
  try {
    await initializeFirebase();
    return !!db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

export const adminService = {
  // ===== Courses =====
  async getCourses() {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) {
        return [];
      }
      const snapshot = await getDocs(
        query(collection(db, 'courses'), orderBy('createdAt', 'desc'))
      );
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return { ...data, id: docSnap.id, modules: data?.modules ?? [] };
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },

  async getCourse(courseId: string) {
    await ensureFirebase();
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const data = courseSnap.data();
    return {
      id: courseSnap.id,
      ...data,
      modules: Array.isArray(data?.modules) ? data.modules : [],
    };
  },

  async createCourse(courseData: Record<string, any>) {
    await ensureFirebase();
    const { id, ...dataWithoutId } = courseData;

    if (id) {
      const courseRef = doc(db, 'courses', id);
      await setDoc(courseRef, {
        ...dataWithoutId,
        modules: dataWithoutId.modules ?? [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    } else {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...dataWithoutId,
        modules: dataWithoutId.modules ?? [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    }
  },

  async updateCourse(courseId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'courses', courseId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteCourse(courseId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'courses', courseId));
  },

  // ===== Modules =====
  async getModule(moduleId: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) return null;

      const moduleRef = doc(db, 'modules', moduleId);
      const moduleSnap = await getDoc(moduleRef);
      if (!moduleSnap.exists()) return null;

      const data = moduleSnap.data();
      return {
        id: moduleSnap.id,
        ...data,
        modules: Array.isArray(data?.modules) ? data.modules : [], // FIX added
      };
    } catch (error) {
      console.error('Error fetching module:', error);
      return null;
    }
  },

  async getModules(courseId?: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) return [];

      let qRef;
      if (courseId) {
        qRef = query(collection(db, 'modules'), where('courseId', '==', courseId));
      } else {
        qRef = query(collection(db, 'modules'));
      }

      const snapshot = await getDocs(qRef);
      const modules = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      return modules.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  },

  async createModule(moduleData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'modules'), {
      ...moduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateModule(moduleId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'modules', moduleId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteModule(moduleId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'modules', moduleId));
  },

  // ===== Lessons =====
  async getLessons(moduleId?: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) return [];

      let qRef;
      if (moduleId) {
        qRef = query(collection(db, 'lessons'), where('moduleId', '==', moduleId));
      } else {
        qRef = query(collection(db, 'lessons'));
      }

      const snapshot = await getDocs(qRef);
      const lessons = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      return lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } catch {
      return [];
    }
  },

  async createLesson(lessonData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'lessons'), {
      ...lessonData,
      completed: lessonData.completed ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateLesson(lessonId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'lessons', lessonId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteLesson(lessonId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'lessons', lessonId));
  },

  // ===== Quizzes =====
  async getQuiz(subjectId: string, moduleId: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db || !subjectId || !moduleId) return null;

      const quizRef = doc(db, 'quizzes', `${subjectId}_${moduleId}`);
      const quizSnap = await getDoc(quizRef);
      if (!quizSnap.exists()) return null;

      return { id: quizSnap.id, ...quizSnap.data() };
    } catch {
      return null;
    }
  },

  async saveQuiz(quizData: any) {
    await ensureFirebase();
    if (!db) return null;

    const quizRef = doc(db, 'quizzes', `${quizData.subjectId}_${quizData.moduleId}`);
    const existingSnap = await getDoc(quizRef);
    const payload = {
      ...quizData,
      questions: Array.isArray(quizData.questions) ? quizData.questions : [],
      updatedAt: serverTimestamp(),
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt : serverTimestamp(),
    };
    await setDoc(quizRef, payload, { merge: true });
    return quizRef.id;
  },

  async deleteQuiz(subjectId: string, moduleId: string) {
    await ensureFirebase();
    const quizId = `${subjectId}_${moduleId}`;
    await deleteDoc(doc(db, 'quizzes', quizId));
  },

  // ===== Projects =====
  async getProjects() {
    await ensureFirebase();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },

  async createProject(projectData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      isPublic: true,
      tags: projectData.tags ?? [],
      upvotes: projectData.upvotes ?? 0,
      comments: projectData.comments ?? 0,
      aiReview: projectData.aiReview ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProject(projectId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProject(projectId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'projects', projectId));
  },

  // ===== Practice Tests =====
  async getPracticeTest(courseId: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db || !courseId) return null;

      const testRef = doc(db, 'practiceTests', courseId);
      const testSnap = await getDoc(testRef);
      if (!testSnap.exists()) return null;

      return { id: testSnap.id, ...testSnap.data() };
    } catch (error) {
      console.error('Error fetching practice test:', error);
      return null;
    }
  },

  async getPracticeTests() {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) return [];

      const snapshot = await getDocs(
        query(collection(db, 'practiceTests'), orderBy('createdAt', 'desc'))
      );
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (error) {
      console.error('Error fetching practice tests:', error);
      return [];
    }
  },

  async savePracticeTest(testData: any) {
    await ensureFirebase();
    if (!db) return null;

    const testRef = doc(db, 'practiceTests', testData.courseId);
    const existingSnap = await getDoc(testRef);
    const payload = {
      ...testData,
      questions: Array.isArray(testData.questions) ? testData.questions : [],
      updatedAt: serverTimestamp(),
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt : serverTimestamp(),
    };
    await setDoc(testRef, payload, { merge: true });
    return testRef.id;
  },

  async deletePracticeTest(courseId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'practiceTests', courseId));
  },

  // ===== Stats =====
  async getStats() {
    await ensureFirebase();
    const [coursesSnap, modulesSnap, projectsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'modules')),
      getDocs(collection(db, 'projects')),
      getDocs(collection(db, 'users')),
    ]);

    return {
      totalUsers: usersSnap.size,
      totalModules: modulesSnap.size,
      totalProjects: projectsSnap.size,
      totalCourses: coursesSnap.size,
    };
  },

  // ===== Users =====
  async getUsers() {
    await ensureFirebase();
    const snapshot = await getDocs(collection(db, 'users'));

    return snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a: any, b: any) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
  },
};

export type AdminService = typeof adminService;
