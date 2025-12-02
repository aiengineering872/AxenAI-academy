'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Award, BookOpen, Download, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Skill {
  name: string;
  level: number;
  target: number;
  status: 'complete' | 'in-progress' | 'not-started';
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'certification' | 'project' | 'job';
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function CareerCompassPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([
    { name: 'Python Programming', level: 85, target: 90, status: 'in-progress' },
    { name: 'Machine Learning', level: 70, target: 90, status: 'in-progress' },
    { name: 'Deep Learning', level: 60, target: 85, status: 'in-progress' },
    { name: 'MLOps', level: 40, target: 80, status: 'not-started' },
    { name: 'Cloud Platforms', level: 50, target: 85, status: 'in-progress' },
  ]);

  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([
    {
      id: '1',
      title: 'Complete Deep Learning Module',
      description: 'Finish the advanced deep learning course',
      category: 'learning',
      completed: false,
      priority: 'high',
    },
    {
      id: '2',
      title: 'AWS Machine Learning Certification',
      description: 'Get certified in AWS ML services',
      category: 'certification',
      completed: false,
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Build Production ML Project',
      description: 'Deploy a complete ML pipeline',
      category: 'project',
      completed: false,
      priority: 'high',
    },
    {
      id: '4',
      title: 'Apply for ML Engineer Roles',
      description: 'Start applying to positions',
      category: 'job',
      completed: false,
      priority: 'low',
    },
  ]);

  const skillsGap = skills.filter((s) => s.level < s.target).length;
  const overallProgress = Math.round(
    (skills.reduce((acc, s) => acc + s.level, 0) / skills.reduce((acc, s) => acc + s.target, 0)) * 100
  );

  const recommendedRole = overallProgress > 80 ? 'Senior ML Engineer' : overallProgress > 60 ? 'ML Engineer' : 'Junior ML Engineer';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning':
        return <BookOpen className="w-5 h-5" />;
      case 'certification':
        return <Award className="w-5 h-5" />;
      case 'project':
        return <Target className="w-5 h-5" />;
      case 'job':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">AI Career Compass</h1>
          <p className="text-textSecondary">Your personalized career roadmap and skills gap analysis</p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">{overallProgress}%</span>
            </div>
            <p className="text-textSecondary">Overall Progress</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">{skillsGap}</span>
            </div>
            <p className="text-textSecondary">Skills Gaps</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-primary" />
              <span className="text-lg font-bold">{recommendedRole}</span>
            </div>
            <p className="text-textSecondary">Recommended Role</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills Gap Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-xl"
          >
            <h2 className="text-2xl font-bold text-text mb-6">Skills Gap Analysis</h2>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text">{skill.name}</span>
                    <span className="text-sm text-textSecondary">
                      {skill.level}% / {skill.target}%
                    </span>
                  </div>
                  <div className="w-full bg-card rounded-full h-2 mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.level / skill.target) * 100}%` }}
                      className={`h-2 rounded-full ${
                        skill.status === 'complete'
                          ? 'bg-green-500'
                          : skill.status === 'in-progress'
                          ? 'bg-primary'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        skill.status === 'complete'
                          ? 'bg-green-500/20 text-green-400'
                          : skill.status === 'in-progress'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {skill.status === 'complete'
                        ? 'Complete'
                        : skill.status === 'in-progress'
                        ? 'In Progress'
                        : 'Not Started'}
                    </span>
                    {skill.level < skill.target && (
                      <span className="text-xs text-textSecondary">
                        Need {skill.target - skill.level}% more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Career Roadmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Career Roadmap</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 rounded-lg transition-all">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="space-y-4">
              {roadmap.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    item.completed
                      ? 'bg-card/50 border-green-500/50'
                      : 'bg-card/30 border-card'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getCategoryIcon(item.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-text">{item.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-textSecondary mb-2">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-textSecondary capitalize">{item.category}</span>
                        {item.completed && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-xl"
        >
          <h2 className="text-2xl font-bold text-text mb-4">AI Recommendations</h2>
          <div className="space-y-3">
            <div className="p-4 bg-card/50 rounded-lg">
              <p className="text-textSecondary">
                <strong className="text-text">Focus Area:</strong> Complete the MLOps module to improve your deployment skills.
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <p className="text-textSecondary">
                <strong className="text-text">Next Steps:</strong> Build a production-ready ML project to demonstrate your skills.
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <p className="text-textSecondary">
                <strong className="text-text">Certification:</strong> Consider AWS or Google Cloud ML certifications to boost your profile.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

