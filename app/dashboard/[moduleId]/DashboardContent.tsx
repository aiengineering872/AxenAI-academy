'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, FlaskConical, TrendingUp, Sparkles, Target, ArrowLeft, Brain, Cpu, BookOpen as BookIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ChartSkeleton from '@/components/dashboard/ChartSkeleton';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { adminService } from '@/lib/services/adminService';

const ModuleProgressChart = dynamic(
  () => import('@/components/dashboard/ModuleProgressChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

const CompletionStatusChart = dynamic(
  () => import('@/components/dashboard/CompletionStatusChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);


// Icon mapping helper
const getCourseIcon = (courseId: string): React.ComponentType<{ className?: string }> => {
  if (courseId.includes('aiml') || courseId.includes('ml')) {
    return Cpu;
  }
  if (courseId.includes('ai')) {
    return Brain;
  }
  return BookIcon;
};

export default function DashboardContent() {
  const params = useParams();
  const courseId = params.moduleId as string; // Using moduleId as courseId for backward compatibility
  const { user, firebaseUser } = useAuth();
  const [progressData, setProgressData] = useState<{ name: string; progress: number }[]>([]);
  const [completionData, setCompletionData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [modulesCompleted, setModulesCompleted] = useState(0);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load course from Firebase
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const courses = await adminService.getCourses();
        const foundCourse = courses.find((c: any) => c.id === courseId);
        setCourse(foundCourse);
      } catch (error) {
        console.error('Error loading course:', error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const moduleConfig = useMemo(() => {
    if (!course) return null;
    return {
      courseId: course.id,
      title: course.title || 'Course',
      icon: getCourseIcon(course.id),
      description: course.description || 'Comprehensive learning course',
    };
  }, [course]);

  const loadProgressData = useCallback(() => {
    if (!moduleConfig) return;

    const courseId = moduleConfig.courseId;
    
    // Get progress data for bar chart (defaults to 0 if no progress)
    const progress = learningProgressService.getDashboardProgressData(courseId);
    setProgressData(progress.length > 0 ? progress : [
      { name: 'Python', progress: 0 },
      { name: 'Machine Learning', progress: 0 },
      { name: 'Deep Learning', progress: 0 },
      { name: 'MLOps', progress: 0 },
    ]);

    // Get completion status for pie chart
    const completion = learningProgressService.getCompletionStatus(courseId);
    setCompletionData(completion.length > 0 ? completion : [
      { name: 'Completed', value: 0, color: '#10b981' },
      { name: 'In Progress', value: 0, color: '#3b82f6' },
      { name: 'Not Started', value: 100, color: '#6b7280' },
    ]);

    // Calculate overall progress
    const overall = learningProgressService.getCourseProgress(courseId);
    setOverallProgress(overall);

    // Count completed modules (100% progress)
    const allModuleProgress = learningProgressService.getAllModuleProgress(courseId);
    const completed = allModuleProgress.filter(m => m.progress === 100).length;
    setModulesCompleted(completed);
  }, [moduleConfig]);

  useEffect(() => {
    if (!moduleConfig) return;
    loadProgressData();

    // Refresh progress when window gains focus (user returns to tab)
    const handleFocus = () => {
      loadProgressData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [moduleConfig, loadProgressData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRank = (level: number) => {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Intermediate';
    if (level < 15) return 'Advanced';
    return 'Expert';
  };

  const displayNameCandidates = [
    user?.displayName,
    firebaseUser?.displayName,
    user?.email?.split('@')[0],
    firebaseUser?.email?.split('@')[0],
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  const resolvedName = displayNameCandidates[0] ?? '';
  const greetingName = resolvedName.split(' ')[0] || resolvedName;
  const greetingSuffix = greetingName ? `, ${greetingName}` : '';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl text-center">
            <p className="text-textSecondary">Loading course...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!moduleConfig || !course) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl text-center">
            <h1 className="text-2xl font-bold text-text mb-4">Course Not Found</h1>
            <p className="text-textSecondary mb-6">The course you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = moduleConfig.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/dashboard">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modules
          </motion.button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-display mb-2">
                {getGreeting()}
                {greetingSuffix}! 👋
              </h1>
              <p className="text-body">{moduleConfig.title} Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-body-strong">Rank: {getRank(user?.level || 1)}</span>
              </div>
            </div>
            <div className="glass px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-body-strong">{user?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">{user?.level || 1}</span>
            </div>
            <p className="text-caption">Level</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">{modulesCompleted}</span>
            </div>
            <p className="text-caption">Modules Completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <FlaskConical className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">12</span>
            </div>
            <p className="text-caption">Projects Submitted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-xl hover:shadow-glow transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">{overallProgress}%</span>
            </div>
            <p className="text-caption">Overall Progress</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass p-6 rounded-xl"
          >
            <h2 className="text-section mb-4">{moduleConfig.title} Module Progress</h2>
            <ModuleProgressChart data={progressData} />
          </motion.div>

          {/* Completion Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass p-6 rounded-xl"
          >
            <h2 className="text-section mb-4">Completion Status</h2>
            <CompletionStatusChart data={completionData.length > 0 ? completionData : [
              { name: 'Completed', value: 0, color: '#10b981' },
              { name: 'In Progress', value: 0, color: '#3b82f6' },
              { name: 'Not Started', value: 100, color: '#6b7280' },
            ]} />
          </motion.div>
        </div>

      </div>
    </DashboardLayout>
  );
}

