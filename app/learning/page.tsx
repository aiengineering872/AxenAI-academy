'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { adminService } from '@/lib/services/adminService';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  levels: string[];
  modules: Module[];
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  weeks: string;
  order?: number;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-500/20 text-green-400';
    case 'intermediate':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'advanced':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export default function LearningHubPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses from Firebase
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Get all courses
        const firebaseCourses = await adminService.getCourses();

        // Get all modules (subjects)
        const allModules = await adminService.getModules();

        // Merge modules into courses
        const finalCourses = firebaseCourses.map((course: any) => {
          const courseModules = allModules
            .filter((m: any) => m.courseId === course.id)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((module: any) => {
              const prog = learningProgressService.getModuleProgress(course.id, module.id);
              return {
                ...module,
                progress: prog.progress,
                weeks: module.duration || '',
                difficulty: module.difficulty || 'beginner',
              } as Module;
            });

          return {
            ...course,
            modules: courseModules,
            levels: Array.isArray(course.levels) ? course.levels : [],
          } as Course;
        });

        setCourses(finalCourses);
      } catch (err) {
        console.error('Error loading courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Update progress when course is selected
  useEffect(() => {
    if (!selectedCourse) return;

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== selectedCourse) return course;

        const updatedModules = course.modules.map((module) => {
          const mProg = learningProgressService.getModuleProgress(course.id, module.id);
          return { ...module, progress: mProg.progress };
        });

        return { ...course, modules: updatedModules };
      })
    );
  }, [selectedCourse]);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-text mb-2">Learning Hub</h1>
          <p className="text-textSecondary">Choose a course and start learning</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">No courses available.</p>
          </div>
        ) : !selectedCourse ? (
          // Course Selection Grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.03, y: -8 }}
                className="group bg-black modern-card glow-border p-6 rounded-xl cursor-pointer"
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#ff6b35]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text">{course.title}</h2>
                    <p className="text-sm text-textSecondary">{course.duration}</p>
                  </div>
                </div>

                <p className="text-textSecondary mb-4">{course.description}</p>

                <div className="flex items-center gap-2 text-primary font-medium">
                  <Play className="w-4 h-4" /> Start Learning
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Subjects List
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="mb-6 text-primary hover:underline"
            >
              ← Back to Courses
            </button>

            <h2 className="text-2xl font-bold text-text mb-2">
              {selectedCourseData?.title}
            </h2>
            <p className="text-textSecondary mb-6">{selectedCourseData?.description}</p>

            {!selectedCourseData || selectedCourseData.modules.length === 0 ? (
              <p className="text-textSecondary text-center py-12">
                No subjects available for this course.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCourseData.modules.map((module) => {
                  return (
                    <motion.div
                      key={module.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="group bg-black modern-card glow-border p-6 rounded-xl"
                    >
                      <h3 className="text-xl font-bold text-text mb-2">
                        {module.title}
                      </h3>

                      <div className="flex items-center gap-4 mb-3">
                        {module.weeks && (
                          <div className="flex items-center gap-2 text-textSecondary">
                            <Clock className="w-4 h-4 text-[#ff6b35]" />
                            <span className="text-sm">{module.weeks}</span>
                          </div>
                        )}

                        {module.difficulty && (
                          <span
                            className={`px-2 py-1 text-xs rounded ${getDifficultyColor(
                              module.difficulty
                            )}`}
                          >
                            {module.difficulty}
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-textSecondary">Progress</span>
                          <span className="text-sm font-medium">{module.progress}%</span>
                        </div>
                        <div className="w-full bg-card rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${module.progress}%` }}
                            className="bg-primary h-2 rounded-full"
                          />
                        </div>
                      </div>

                      {module.id && selectedCourse ? (
                        <Link
                          href={`/learning/${selectedCourse}/${module.id}`}
                          className="w-full py-3 bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] text-white rounded-lg flex justify-center gap-2 items-center transition-all hover:scale-105 cursor-pointer relative z-10"
                          prefetch={true}
                        >
                          {module.progress > 0 ? (
                            <>
                              <CheckCircle className="w-5 h-5" /> Continue Learning
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" /> Start Learning
                            </>
                          )}
                        </Link>
                      ) : (
                        <div className="w-full py-3 bg-gray-500/50 text-white rounded-lg flex justify-center gap-2 items-center cursor-not-allowed opacity-50">
                          <Play className="w-5 h-5" /> Start Learning
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
