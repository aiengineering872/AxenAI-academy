'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, BookOpen, FlaskConical, MessageSquare, Plus, Edit, Trash2, TrendingUp, Clock, ChevronDown, ListChecks, FileText } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import CourseModal from '@/components/admin/CourseModal';
import ProjectModal from '@/components/admin/ProjectModal';
import SubjectModal from '@/components/admin/SubjectModal';
import TopicModal from '@/components/admin/TopicModal';
import QuizModal, { QuizQuestion } from '@/components/admin/QuizModal';

type AdminTab = 'dashboard' | 'courses' | 'subjects' | 'topics' | 'quizzes' | 'practiceTests' | 'projects' | 'users' | 'faq';

const tabs: Array<{ id: AdminTab; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'topics', label: 'Topics', icon: BookOpen },
  { id: 'quizzes', label: 'Quizzes', icon: ListChecks },
  { id: 'practiceTests', label: 'Practice Tests', icon: FileText },
  { id: 'projects', label: 'Projects', icon: FlaskConical },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'faq', label: 'FAQ', icon: MessageSquare },
];

const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!hours && !minutes && secs) parts.push(`${secs}s`);
  return parts.slice(0, 2).join(' ');
};

const computeActivity = (activityLog: Record<string, number> | undefined) => {
  const today = new Date();
  const todayKey = getDateKey(today);
  const todaySeconds = activityLog?.[todayKey] ?? 0;

  let last7DaysSeconds = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = getDateKey(date);
    const value = activityLog?.[key];
    if (typeof value === 'number') {
      last7DaysSeconds += value;
    }
  }

  return {
    todaySeconds,
    last7DaysSeconds,
  };
};

export default function AdminPanelPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    totalProjects: 0,
    totalCourses: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  // Topics management state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [subjectModules, setSubjectModules] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  // Quiz management state
  const [quizCourseId, setQuizCourseId] = useState<string>('');
  const [quizSubjectId, setQuizSubjectId] = useState<string>('');
  const [quizModuleId, setQuizModuleId] = useState<string>('');
  const [quizModules, setQuizModules] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizQuestion, setEditingQuizQuestion] = useState<QuizQuestion | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  // Practice Tests management state
  const [practiceTestCourseId, setPracticeTestCourseId] = useState<string>('');
  const [practiceTestQuestions, setPracticeTestQuestions] = useState<QuizQuestion[]>([]);
  const [showPracticeTestModal, setShowPracticeTestModal] = useState(false);
  const [editingPracticeTestQuestion, setEditingPracticeTestQuestion] = useState<QuizQuestion | null>(null);
  const [practiceTestLoading, setPracticeTestLoading] = useState(false);
  const [practiceTestData, setPracticeTestData] = useState<any>(null);
  
  // Sync courses from learning hub to Firebase
  const syncCoursesFromLearningHub = async () => {
    try {
      const existingCourses = await adminService.getCourses();
      const existingCourseIds = existingCourses.map((c: any) => c.id);
      
      // Define courses from learning hub (only courses that should be auto-synced)
      const learningHubCourses = [
        {
          id: 'aiml-engineering',
          title: 'AI/ML Engineering',
          description: 'Comprehensive AI and Machine Learning engineering course',
          duration: '4 weeks',
          levels: ['beginner', 'intermediate', 'advanced'],
        },
      ];
      
      // List of course IDs that should NOT be auto-created (removed from hardcoded list)
      const excludedCourseIds = ['ai-engineering', 'aiml-engineering'];
      
      // Add courses that don't exist in Firebase and are not excluded
      for (const course of learningHubCourses) {
        if (!existingCourseIds.includes(course.id) && !excludedCourseIds.includes(course.id)) {
          await adminService.createCourse(course);
          console.log(`Created course: ${course.title}`);
        }
      }
      
      // Reload courses after syncing
      if (activeTab === 'courses') {
        const updatedCourses = await adminService.getCourses();
        setCourses(updatedCourses);
      }
    } catch (error) {
      console.error('Error syncing courses:', error);
    }
  };

  const loadQuizQuestions = useCallback(
    async (subjectId: string, moduleId: string) => {
      if (!subjectId || !moduleId) {
        setQuizQuestions([]);
        return;
      }
      try {
        setQuizLoading(true);
        const quizData = await adminService.getQuiz(subjectId, moduleId) as any;
        if (quizData?.questions && Array.isArray(quizData.questions)) {
          const sorted = [...quizData.questions].sort(
            (a: QuizQuestion, b: QuizQuestion) => (a.order ?? 0) - (b.order ?? 0)
          );
          setQuizQuestions(sorted);
        } else {
          setQuizQuestions([]);
        }
      } catch (error) {
        console.error('Error loading quiz questions:', error);
        setQuizQuestions([]);
      } finally {
        setQuizLoading(false);
      }
    },
    []
  );

  const loadPracticeTestQuestions = useCallback(
    async (courseId: string) => {
      if (!courseId) {
        setPracticeTestQuestions([]);
        setPracticeTestData(null);
        return;
      }
      try {
        setPracticeTestLoading(true);
        const testData = await adminService.getPracticeTest(courseId) as any;
        if (testData) {
          setPracticeTestData(testData);
          if (testData.questions && Array.isArray(testData.questions)) {
            const sorted = [...testData.questions].sort(
              (a: QuizQuestion, b: QuizQuestion) => (a.order ?? 0) - (b.order ?? 0)
            );
            setPracticeTestQuestions(sorted);
          } else {
            setPracticeTestQuestions([]);
          }
        } else {
          setPracticeTestData(null);
          setPracticeTestQuestions([]);
        }
      } catch (error) {
        console.error('Error loading practice test:', error);
        setPracticeTestQuestions([]);
        setPracticeTestData(null);
      } finally {
        setPracticeTestLoading(false);
      }
    },
    []
  );
  
  // Debug: Log courses and hasCourses state
  const loadData = useCallback(async (skipSync = false) => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsData = await adminService.getStats();
        setStats(statsData);
      }

      if (activeTab === 'courses') {
        const coursesData = await adminService.getCourses();
        setCourses(coursesData);
        
        // Sync courses from learning hub if they don't exist (skip after delete)
        if (!skipSync) {
          await syncCoursesFromLearningHub();
        }
      }

      if (activeTab === 'subjects') {
        await syncCoursesFromLearningHub();
        
        const [subjectsData, coursesData] = await Promise.all([
          adminService.getModules(selectedCourseId || undefined),
          adminService.getCourses(),
        ]);
        setSubjects(subjectsData);
        setCourses(coursesData);
      }

      if (activeTab === 'topics') {
        await syncCoursesFromLearningHub();
        const coursesData = await adminService.getCourses();
        setCourses(coursesData);
        
        if (selectedCourseId) {
          const subjectsData = await adminService.getModules(selectedCourseId);
          setSubjects(subjectsData);
        }
        
        if (selectedSubjectId) {
          const subjectData = await adminService.getModule(selectedSubjectId) as any;
          if (subjectData?.modules && Array.isArray(subjectData.modules)) {
            setSubjectModules(subjectData.modules);
          } else {
            setSubjectModules([]);
          }
        }
        
        if (selectedSubjectId && selectedModuleId) {
          const subjectData = await adminService.getModule(selectedSubjectId) as any;
          if (subjectData?.modules) {
            const module = subjectData.modules.find((m: any) => m.id === selectedModuleId);
            if (module?.topics) {
              setTopics(module.topics);
            } else {
              setTopics([]);
            }
          }
        }
      }

      if (activeTab === 'quizzes') {
        await syncCoursesFromLearningHub();
        const coursesData = await adminService.getCourses();
        setCourses(coursesData);

        if (quizCourseId) {
          const subjectsData = await adminService.getModules(quizCourseId);
          setSubjects(subjectsData);
        } else {
          setSubjects([]);
        }

        if (quizSubjectId) {
          const subjectData = await adminService.getModule(quizSubjectId) as any;
          if (subjectData?.modules && Array.isArray(subjectData.modules)) {
            setQuizModules(subjectData.modules);
          } else {
            setQuizModules([]);
          }
        } else {
          setQuizModules([]);
        }

        if (quizSubjectId && quizModuleId) {
          await loadQuizQuestions(quizSubjectId, quizModuleId);
        } else {
          setQuizQuestions([]);
        }
      }

      if (activeTab === 'practiceTests') {
        await syncCoursesFromLearningHub();
        const coursesData = await adminService.getCourses();
        setCourses(coursesData);

        if (practiceTestCourseId) {
          await loadPracticeTestQuestions(practiceTestCourseId);
        } else {
          setPracticeTestQuestions([]);
          setPracticeTestData(null);
        }
      }

      if (activeTab === 'projects') {
        const projectsData = await adminService.getProjects();
        setProjects(projectsData);
      }

      if (activeTab === 'users') {
        const usersData = await adminService.getUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setLoading(false);
  }, [activeTab, selectedCourseId, quizCourseId, quizSubjectId, quizModuleId, loadQuizQuestions, practiceTestCourseId, loadPracticeTestQuestions]);

  // Sync courses when admin panel loads (only once)
  useEffect(() => {
    if (isAdmin && !authLoading && activeTab === 'courses') {
      syncCoursesFromLearningHub().then(() => {
        void loadData();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading, activeTab, loadData]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin, loadData]);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;

    try {
      await adminService.deleteProject(projectId);
      await loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleProjectSaved = async () => {
    await loadData();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Delete this course? This action cannot be undone.')) return;

    if (!courseId) {
      alert('Error: Course ID is missing. Cannot delete course.');
      console.error('Course ID is missing');
      return;
    }

    try {
      console.log('Attempting to delete course with ID:', courseId);
      
      // Optimistically remove from UI immediately
      setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
      
      await adminService.deleteCourse(courseId);
      console.log('Course deleted successfully from Firebase');
      
      // Reload data without syncing to prevent auto-recreation of deleted courses
      // This ensures we have the latest state from Firebase
      await loadData(true);
      
      // Show success message
      console.log('Course deletion completed successfully');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        courseId: courseId
      });
      
      // Restore the course in the UI if deletion failed
      await loadData(true);
      
      // Show detailed error message
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to delete course: ${errorMessage}\n\nError code: ${error?.code || 'N/A'}\n\nPlease check the console for more details.`);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Delete this subject? This action cannot be undone.')) return;

    try {
      await adminService.deleteModule(subjectId);
      await loadData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject. Please try again.');
    }
  };

  const handleQuizCourseSelect = (value: string) => {
    setQuizCourseId(value);
    setQuizSubjectId('');
    setQuizModuleId('');
    setQuizModules([]);
    setQuizQuestions([]);
  };

  const handleQuizSubjectSelect = (value: string) => {
    setQuizSubjectId(value);
    setQuizModuleId('');
    setQuizQuestions([]);
  };

  const handleQuizModuleSelect = async (value: string) => {
    setQuizModuleId(value);
    if (value && quizSubjectId) {
      await loadQuizQuestions(quizSubjectId, value);
    } else {
      setQuizQuestions([]);
    }
  };

  const persistQuizChanges = async (updatedQuestions: QuizQuestion[]) => {
    if (!quizCourseId || !quizSubjectId || !quizModuleId) {
      alert('Please select a course, subject, and module first.');
      return;
    }
    const courseMeta = courses.find((course) => course.id === quizCourseId);
    const subjectMeta = subjects.find((subject) => subject.id === quizSubjectId);
    const moduleMeta = quizModules.find((module) => module.id === quizModuleId);
    try {
      await adminService.saveQuiz({
        courseId: quizCourseId,
        courseTitle: courseMeta?.title,
        subjectId: quizSubjectId,
        subjectTitle: subjectMeta?.title,
        moduleId: quizModuleId,
        moduleName: moduleMeta?.name,
        questions: updatedQuestions,
      });
      const sorted = [...updatedQuestions].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      setQuizQuestions(sorted);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz. Please try again.');
    }
  };

  const handlePracticeTestCourseSelect = async (value: string) => {
    setPracticeTestCourseId(value);
    if (value) {
      await loadPracticeTestQuestions(value);
    } else {
      setPracticeTestQuestions([]);
      setPracticeTestData(null);
    }
  };

  const handleSavePracticeTestQuestion = async (question: QuizQuestion) => {
    try {
      if (!practiceTestCourseId) {
        alert('Please select a course first');
        return;
      }

      const selectedCourse = courses.find((c) => c.id === practiceTestCourseId);
      const currentTest = practiceTestData || {
        courseId: practiceTestCourseId,
        title: selectedCourse?.title || 'Practice Test',
        description: `Comprehensive practice test covering all subjects in ${selectedCourse?.title || 'this course'}`,
        duration: 30,
        difficulty: 'beginner',
        questions: [],
      };

      let updatedQuestions: QuizQuestion[];
      if (editingPracticeTestQuestion) {
        updatedQuestions = practiceTestQuestions.map((q) =>
          q.id === editingPracticeTestQuestion.id ? question : q
        );
      } else {
        updatedQuestions = [...practiceTestQuestions, question];
      }

      const testData = {
        ...currentTest,
        questions: updatedQuestions,
      };

      await adminService.savePracticeTest(testData);
      await loadPracticeTestQuestions(practiceTestCourseId);
      setShowPracticeTestModal(false);
      setEditingPracticeTestQuestion(null);
    } catch (error) {
      console.error('Error saving practice test question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleDeletePracticeTestQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      if (!practiceTestCourseId || !practiceTestData) return;

      const updatedQuestions = practiceTestQuestions.filter((q) => q.id !== questionId);
      const testData = {
        ...practiceTestData,
        questions: updatedQuestions,
      };

      await adminService.savePracticeTest(testData);
      await loadPracticeTestQuestions(practiceTestCourseId);
    } catch (error) {
      console.error('Error deleting practice test question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  const handleSaveQuizQuestion = async (question: QuizQuestion) => {
    const updatedQuestions = editingQuizQuestion
      ? quizQuestions.map((existing) => (existing.id === question.id ? question : existing))
      : [...quizQuestions, question];
    await persistQuizChanges(updatedQuestions);
    setShowQuizModal(false);
    setEditingQuizQuestion(null);
  };

  const handleDeleteQuizQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    const updatedQuestions = quizQuestions.filter((question) => question.id !== questionId);
    await persistQuizChanges(updatedQuestions);
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-text">Admin Panel</h1>
          <p className="text-textSecondary">Manage content, users, and platform settings</p>
        </motion.div>

        <div className="flex gap-4 border-b border-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textSecondary hover:text-text'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <Users className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalUsers}</span>
              </div>
              <p className="text-textSecondary">Total Learners</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <FlaskConical className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalProjects}</span>
              </div>
              <p className="text-textSecondary">Projects</p>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalCourses}</span>
              </div>
              <p className="text-textSecondary">Courses</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'courses' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Courses</h2>
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Add Course
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center">Loading courses...</div>
            ) : (
              <div className="glass rounded-xl p-6">
                <div className="space-y-4">
                  {courses.map((course) => {
                    const levelList = Array.isArray(course.levels) && course.levels.length
                      ? course.levels.join(', ')
                      : 'n/a';

                    return (
                      <div key={course.id} className="flex items-center justify-between rounded-lg bg-card/50 p-4 transition hover:bg-card">
                        <div>
                          <h3 className="font-medium text-text">{course.title}</h3>
                          <p className="text-sm text-textSecondary">{course.description}</p>
                          <p className="text-xs text-textSecondary">
                            {course.duration} • Levels: {levelList}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCourse(course);
                              setShowCourseModal(true);
                            }}
                            className="rounded p-2 transition hover:bg-card"
                          >
                            <Edit className="h-5 w-5 text-textSecondary" />
                          </button>
                          <button 
                            onClick={() => {
                              console.log('Delete button clicked for course:', {
                                id: course.id,
                                title: course.title,
                                fullCourse: course
                              });
                              if (!course.id) {
                                alert('Error: Course ID is missing. Cannot delete course.');
                                console.error('Course object:', course);
                                return;
                              }
                              handleDeleteCourse(course.id);
                            }} 
                            className="rounded p-2 transition hover:bg-card"
                          >
                            <Trash2 className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                    </div>
                    );
                  })}
                  {courses.length === 0 && (
                    <div className="py-8 text-center text-textSecondary">No courses yet. Create your first course.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'subjects' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-text">Subjects</h2>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                    }}
                    className="appearance-none rounded-lg border border-card bg-card px-4 py-2 pr-10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary" />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (courses.length === 0) {
                      alert('Please create a course first before adding subjects. Go to the "Courses" tab to create one.');
                      return;
                    }
                    
                    if (!selectedCourseId) {
                      alert('Please select a course first');
                      return;
                    }
                    
                    setEditingSubject(null);
                    setShowSubjectModal(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90 relative z-10 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    opacity: courses.length > 0 && selectedCourseId ? 1 : 0.5,
                  }}
                >
                  <Plus className="h-5 w-5" />
                  Add Subject
                </button>
              </div>
            </div>
            
            {selectedCourseId && (
              <p className="text-sm text-textSecondary">
                Showing subjects for: <span className="font-medium text-text">{courses.find(c => c.id === selectedCourseId)?.title || 'Unknown'}</span>
              </p>
            )}

            {!loading && courses.length === 0 && (
              <p className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Create a course first, then you can add subjects to it.
              </p>
            )}

            {loading ? (
              <div className="py-8 text-center">Loading subjects...</div>
            ) : (
              <div className="glass rounded-xl p-6">
                <div className="space-y-4">
                  {subjects.map((subject) => {
                    const course = courses.find((courseItem) => courseItem.id === subject.courseId);
                    
                    return (
                      <div key={subject.id} className="flex items-center justify-between rounded-lg bg-card/50 p-4 transition hover:bg-card">
                        <div>
                          <h3 className="font-medium text-text">{subject.title}</h3>
                          <p className="text-sm text-textSecondary">
                            {course?.title ?? 'Unassigned'} • {subject.difficulty} • {subject.duration}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSubject(subject);
                              setShowSubjectModal(true);
                            }}
                            className="rounded p-2 transition hover:bg-card"
                          >
                            <Edit className="h-5 w-5 text-textSecondary" />
                          </button>
                          <button onClick={() => handleDeleteSubject(subject.id)} className="rounded p-2 transition hover:bg-card">
                            <Trash2 className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {subjects.length === 0 && selectedCourseId && (
                    <div className="py-8 text-center text-textSecondary">No subjects yet for this course. Click "Add Subject" to create one.</div>
                  )}
                  
                  {subjects.length === 0 && !selectedCourseId && (
                    <div className="py-8 text-center text-textSecondary">Please select a course to view its subjects.</div>
                  )}
                </div>
              </div>
          )}
        </motion.div>
        )}

        {activeTab === 'topics' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-text">Topics</h2>
            </div>

            {/* Course Selection */}
            <div className="glass rounded-xl p-6">
              <label className="mb-2 block text-sm font-medium text-textSecondary">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedSubjectId('');
                  setSelectedModuleId('');
                  setSubjectModules([]);
                  setTopics([]);
                }}
                className="w-full rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            {selectedCourseId && (
              <div className="glass rounded-xl p-6">
                <label className="mb-2 block text-sm font-medium text-textSecondary">Select Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={async (e) => {
                    const subjectId = e.target.value;
                    setSelectedSubjectId(subjectId);
                    setSelectedModuleId('');
                    setTopics([]);
                    if (subjectId) {
                      const subjectData = await adminService.getModule(subjectId) as any;
                      if (subjectData?.modules && Array.isArray(subjectData.modules)) {
                        setSubjectModules(subjectData.modules);
                      } else {
                        setSubjectModules([]);
                      }
                    } else {
                      setSubjectModules([]);
                    }
                  }}
                  className="w-full rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Subject</option>
                  {subjects
                    .filter((s) => s.courseId === selectedCourseId)
                    .map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.title}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Module Selection */}
            {selectedSubjectId && subjectModules.length > 0 && (
              <div className="glass rounded-xl p-6">
                <label className="mb-2 block text-sm font-medium text-textSecondary">Select Module</label>
                <select
                  value={selectedModuleId}
                  onChange={async (e) => {
                    const moduleId = e.target.value;
                    setSelectedModuleId(moduleId);
                    if (moduleId && selectedSubjectId) {
                      const subjectData = await adminService.getModule(selectedSubjectId) as any;
                      if (subjectData?.modules) {
                        const module = subjectData.modules.find((m: any) => m.id === moduleId);
                        if (module?.topics) {
                          setTopics(module.topics);
                        } else {
                          setTopics([]);
                        }
                      }
                    } else {
                      setTopics([]);
                    }
                  }}
                  className="w-full rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Module</option>
                  {subjectModules.map((module: any) => (
                    <option key={module.id} value={module.id}>
                      {module.number ? `Module ${module.number}` : 'Module'} - {module.name || 'Unnamed'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Topics List */}
            {selectedModuleId && (
              <div className="glass rounded-xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text">Topics</h3>
                  <button
                    onClick={() => {
                      setEditingTopic(null);
                      setShowTopicModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                    Add Topic
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center">Loading topics...</div>
                ) : topics.length === 0 ? (
                  <div className="py-8 text-center text-textSecondary">No topics yet. Click "Add Topic" to create one.</div>
                ) : (
                  <div className="space-y-3">
                    {topics
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((topic: any) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between rounded-lg bg-card/50 p-4 transition hover:bg-card"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-text">{topic.name || 'Unnamed Topic'}</h4>
                            <p className="mt-1 text-sm text-textSecondary line-clamp-2">
                              {topic.content || 'No content'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingTopic({ ...topic, moduleId: selectedModuleId, subjectId: selectedSubjectId });
                                setShowTopicModal(true);
                              }}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Edit className="h-5 w-5 text-textSecondary" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this topic? This action cannot be undone.')) return;
                                try {
                                  const subjectData = await adminService.getModule(selectedSubjectId) as any;
                                  if (subjectData?.modules) {
                                    const updatedModules = subjectData.modules.map((m: any) => {
                                      if (m.id === selectedModuleId) {
                                        return {
                                          ...m,
                                          topics: (m.topics || []).filter((t: any) => t.id !== topic.id),
                                        };
                                      }
                                      return m;
                                    });
                                    await adminService.updateModule(selectedSubjectId, {
                                      ...subjectData,
                                      modules: updatedModules,
                                    });
                                    // Reload topics
                                    const module = updatedModules.find((m: any) => m.id === selectedModuleId);
                                    setTopics(module?.topics || []);
                                  }
                                } catch (error) {
                                  console.error('Error deleting topic:', error);
                                  alert('Failed to delete topic. Please try again.');
                                }
                              }}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Trash2 className="h-5 w-5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {selectedCourseId && !selectedSubjectId && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Select a subject to manage topics.
              </div>
            )}

            {selectedSubjectId && subjectModules.length === 0 && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                This subject has no modules. Add modules in the Subjects tab first.
              </div>
            )}

            {selectedSubjectId && subjectModules.length > 0 && !selectedModuleId && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Select a module to manage topics.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'quizzes' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-text">Practice Quizzes</h2>
                <p className="text-sm text-textSecondary">
                  Link quizzes to each module so learners can test their knowledge.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingQuizQuestion(null);
                  setShowQuizModal(true);
                }}
                disabled={!quizModuleId}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition ${
                  quizModuleId ? 'bg-primary hover:bg-primary/90' : 'bg-primary/40 cursor-not-allowed'
                }`}
              >
                <Plus className="h-5 w-5" />
                Add Question
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textSecondary">Select Course</label>
                <select
                  value={quizCourseId}
                  onChange={(event) => handleQuizCourseSelect(event.target.value)}
                  className="w-full rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-textSecondary">Select Subject</label>
                <select
                  value={quizSubjectId}
                  onChange={(event) => handleQuizSubjectSelect(event.target.value)}
                  disabled={!quizCourseId}
                  className="w-full rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Choose a subject</option>
                  {subjects
                    .filter((subject) => subject.courseId === quizCourseId)
                    .map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-textSecondary">Select Module</label>
                <select
                  value={quizModuleId}
                  onChange={(event) => handleQuizModuleSelect(event.target.value)}
                  disabled={!quizSubjectId}
                  className="w-full rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Choose a module</option>
                  {quizModules.map((module: any, index: number) => (
                    <option key={module.id} value={module.id}>
                      {module.number ? `Module ${module.number}` : `Module ${index + 1}`} - {module.name || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!quizCourseId && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Select a course to begin managing quizzes.
              </div>
            )}

            {quizCourseId && !quizSubjectId && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Choose a subject to see its modules.
              </div>
            )}

            {quizCourseId && quizSubjectId && !quizModuleId && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Select a module to view or add quiz questions.
              </div>
            )}

            {quizModuleId && (
              <div className="glass rounded-xl p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text">
                      Questions ({quizQuestions.length})
                    </h3>
                    <p className="text-sm text-textSecondary">
                      {quizModules.find((module) => module.id === quizModuleId)?.name || 'Selected module'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingQuizQuestion(null);
                      setShowQuizModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm text-primary transition hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    New Question
                  </button>
                </div>

                {quizLoading ? (
                  <div className="py-8 text-center text-textSecondary">Loading questions...</div>
                ) : quizQuestions.length === 0 ? (
                  <div className="py-8 text-center text-textSecondary">
                    No questions yet. Click “New Question” to create one.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizQuestions.map((question, index) => (
                      <div key={question.id} className="rounded-xl border border-card/50 bg-card/40 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-text">
                              Q{index + 1}. {question.prompt}
                            </p>
                            <p className="text-xs uppercase tracking-widest text-textSecondary mt-1">
                              Difficulty: {question.difficulty ?? 'easy'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingQuizQuestion(question);
                                setShowQuizModal(true);
                              }}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Edit className="h-5 w-5 text-textSecondary" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuizQuestion(question.id)}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Trash2 className="h-5 w-5 text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                optionIndex === question.correctOptionIndex
                                  ? 'border-primary/60 bg-primary/10 text-primary'
                                  : 'border-card/40 bg-card/30 text-text'
                              }`}
                            >
                              {optionIndex + 1}. {option}
                              {optionIndex === question.correctOptionIndex && (
                                <span className="ml-2 text-xs uppercase tracking-wide">Correct</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="mt-3 rounded-lg bg-card/30 p-3 text-sm text-textSecondary">
                            <span className="font-medium text-text">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'practiceTests' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-text">Practice Tests</h2>
                <p className="text-sm text-textSecondary">
                  Create comprehensive practice tests that cover all subjects in a course.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPracticeTestQuestion(null);
                  setShowPracticeTestModal(true);
                }}
                disabled={!practiceTestCourseId}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition ${
                  practiceTestCourseId ? 'bg-primary hover:bg-primary/90' : 'bg-primary/40 cursor-not-allowed'
                }`}
              >
                <Plus className="h-5 w-5" />
                Add Question
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-textSecondary">Select Course</label>
              <select
                value={practiceTestCourseId}
                onChange={(event) => handlePracticeTestCourseSelect(event.target.value)}
                className="w-full max-w-md rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {!practiceTestCourseId && (
              <div className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
                Select a course to begin managing practice tests.
              </div>
            )}

            {practiceTestCourseId && (
              <div className="glass rounded-xl p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text">
                      Questions ({practiceTestQuestions.length})
                    </h3>
                    <p className="text-sm text-textSecondary">
                      {courses.find((c) => c.id === practiceTestCourseId)?.title || 'Selected course'}
                    </p>
                    {practiceTestData && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-textSecondary">
                        <span>Duration: {practiceTestData.duration || 30} minutes</span>
                        <span>Difficulty: {practiceTestData.difficulty || 'beginner'}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingPracticeTestQuestion(null);
                      setShowPracticeTestModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm text-primary transition hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    New Question
                  </button>
                </div>

                {practiceTestLoading ? (
                  <div className="py-8 text-center text-textSecondary">Loading questions...</div>
                ) : practiceTestQuestions.length === 0 ? (
                  <div className="py-8 text-center text-textSecondary">
                    No questions yet. Click "New Question" to create one.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {practiceTestQuestions.map((question, index) => (
                      <div key={question.id} className="rounded-xl border border-card/50 bg-card/40 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-text">
                              Q{index + 1}. {question.prompt}
                            </p>
                            <p className="text-xs uppercase tracking-widest text-textSecondary mt-1">
                              Difficulty: {question.difficulty ?? 'easy'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingPracticeTestQuestion(question);
                                setShowPracticeTestModal(true);
                              }}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Edit className="h-5 w-5 text-textSecondary" />
                            </button>
                            <button
                              onClick={() => handleDeletePracticeTestQuestion(question.id)}
                              className="rounded p-2 transition hover:bg-card"
                            >
                              <Trash2 className="h-5 w-5 text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                optionIndex === question.correctOptionIndex
                                  ? 'border-primary/60 bg-primary/10 text-primary'
                                  : 'border-card/40 bg-card/30 text-text'
                              }`}
                            >
                              {optionIndex + 1}. {option}
                              {optionIndex === question.correctOptionIndex && (
                                <span className="ml-2 text-xs uppercase tracking-wide">Correct</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="mt-3 rounded-lg bg-card/30 p-3 text-sm text-textSecondary">
                            <span className="font-medium text-text">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Project Lab</h2>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Add Project
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center">Loading projects...</div>
            ) : (
              <div className="glass rounded-xl p-6">
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex flex-col gap-3 rounded-lg bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-text">{project.title}</h3>
                          {project.isPublic === false && (
                            <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">Private</span>
                          )}
                        </div>
                        <p className="text-sm text-textSecondary">{project.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-textSecondary">
                          {Array.isArray(project.tags) &&
                            project.tags.map((tag: string) => (
                              <span key={tag} className="rounded-full bg-card px-2 py-1">
                                #{tag}
                              </span>
                            ))}
                        </div>
                        <div className="text-xs text-textSecondary">
                          Owner: {project.userName || project.ownerName || 'Unknown'}{' '}
                          {project.ownerEmail ? `• ${project.ownerEmail}` : ''}
                        </div>
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-sm text-primary hover:underline"
                          >
                            View on GitHub
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setShowProjectModal(true);
                          }}
                          className="rounded p-2 transition hover:bg-card"
                        >
                          <Edit className="h-5 w-5 text-textSecondary" />
                        </button>
                        <button onClick={() => handleDeleteProject(project.id)} className="rounded p-2 transition hover:bg-card">
                          <Trash2 className="h-5 w-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="py-8 text-center text-textSecondary">No projects yet.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">User Management</h2>
            </div>
            <div className="glass rounded-xl p-6">
              {loading ? (
                <div className="py-8 text-center text-textSecondary">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-textSecondary">No users found yet.</div>
              ) : (
                <div className="divide-y divide-card/60">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
                      <div className="flex items-center gap-4">
                        {userItem.photoURL ? (
                          <img
                            src={userItem.photoURL}
                            alt={userItem.displayName || userItem.email || 'User avatar'}
                            className="h-12 w-12 rounded-full object-cover border border-primary/40"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold">
                            {(userItem.displayName || userItem.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-text">
                            {userItem.displayName || userItem.email || 'Unknown user'}
                          </p>
                          <p className="text-sm text-textSecondary">{userItem.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-textSecondary">
                        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                          Role: <span className="font-medium text-text">{userItem.role || 'student'}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                          Level: <span className="font-medium text-text">{userItem.level ?? 1}</span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                          XP: <span className="font-medium text-text">{userItem.xp ?? 0}</span>
                        </span>
                        {(() => {
                          const { todaySeconds, last7DaysSeconds } = computeActivity(userItem.activityLog);
                          const hasActivity = todaySeconds > 0 || last7DaysSeconds > 0;
                          if (!hasActivity) {
                            return (
                              <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                                <Clock className="h-4 w-4" />
                                Activity: <span className="font-medium text-text">No data</span>
                              </span>
                            );
                          }

                          return (
                            <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                              <Clock className="h-4 w-4" />
                              Activity:{' '}
                              <span className="font-medium text-text">
                                {formatDuration(todaySeconds)} today • {formatDuration(last7DaysSeconds)} / 7d
                              </span>
                            </span>
                          );
                        })()}
                        {userItem.createdAt && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                            Joined:{' '}
                            <span className="font-medium text-text">
                              {typeof userItem.createdAt?.toDate === 'function'
                                ? userItem.createdAt.toDate().toLocaleDateString()
                                : new Date(userItem.createdAt).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'faq' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">FAQ & Knowledge Base</h2>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="text-textSecondary">FAQ management coming soon.</p>
            </div>
          </motion.div>
        )}

        <CourseModal
          isOpen={showCourseModal}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
          }}
          onSuccess={() => void loadData()}
          course={editingCourse}
        />

        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSuccess={handleProjectSaved}
          project={editingProject}
        />

        <SubjectModal
          isOpen={showSubjectModal}
          onClose={() => {
            setShowSubjectModal(false);
            setEditingSubject(null);
          }}
          onSuccess={() => {
            void loadData();
          }}
          subject={editingSubject}
          courses={courses}
          preselectedCourseId={selectedCourseId}
        />

        <TopicModal
          isOpen={showTopicModal}
          onClose={() => {
            setShowTopicModal(false);
            setEditingTopic(null);
          }}
          onSuccess={async () => {
            // Reload subject data after save to ensure modules are preserved
            if (selectedSubjectId) {
              const subjectData = await adminService.getModule(selectedSubjectId) as any;
              console.log('Reloading after topic save - Subject data:', subjectData);
              console.log('Reloading after topic save - Modules:', subjectData?.modules);
              
              if (subjectData?.modules && Array.isArray(subjectData.modules)) {
                // Update subjectModules to reflect any changes
                setSubjectModules(subjectData.modules);
                
                // Update topics for selected module
                if (selectedModuleId) {
                  const module = subjectData.modules.find((m: any) => m.id === selectedModuleId);
                  if (module?.topics) {
                    setTopics(module.topics);
                  } else {
                    setTopics([]);
                  }
                }
              } else {
                console.warn('No modules found after topic save!');
                setSubjectModules([]);
                setTopics([]);
              }
            }
            void loadData();
          }}
          topic={editingTopic}
          moduleId={selectedModuleId}
          subjectId={selectedSubjectId}
        />

        <QuizModal
          isOpen={showQuizModal}
          onClose={() => {
            setShowQuizModal(false);
            setEditingQuizQuestion(null);
          }}
          onSave={handleSaveQuizQuestion}
          question={editingQuizQuestion ?? undefined}
        />

        <QuizModal
          isOpen={showPracticeTestModal}
          onClose={() => {
            setShowPracticeTestModal(false);
            setEditingPracticeTestQuestion(null);
          }}
          onSave={handleSavePracticeTestQuestion}
          question={editingPracticeTestQuestion ?? undefined}
        />
        
      </div>
    </DashboardLayout>
  );
}


