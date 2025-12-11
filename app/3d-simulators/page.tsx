'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Code, Brain, Network, Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const subjects = [
  { id: 'python', name: 'Python', icon: Code, path: '/3d-simulators/python' },
  { id: 'machine-learning', name: 'Machine Learning', icon: Brain, path: '/3d-simulators/machine-learning' },
  { id: 'deep-learning', name: 'Deep Learning', icon: Network, path: '/3d-simulators/deep-learning' },
  { id: 'genai', name: 'GenAI', icon: Sparkles, path: '/3d-simulators/genai' },
];

const simulators: Record<string, Array<{ id: string; name: string; description: string; icon: any }>> = {
  python: [
    { id: 'python-basics', name: 'Python Basics', description: 'Learn Python fundamentals with interactive 3D visualizations', icon: Code },
    { id: 'data-structures', name: 'Data Structures', description: 'Visualize arrays, lists, and trees in 3D', icon: Code },
    { id: 'algorithms', name: 'Algorithms', description: 'Step through sorting and searching algorithms', icon: Code },
  ],
  'machine-learning': [
    { id: 'linear-regression', name: 'Linear Regression', description: 'Visualize regression models in 3D space', icon: Brain },
    { id: 'classification', name: 'Classification', description: 'Explore decision boundaries in 3D', icon: Brain },
    { id: 'clustering', name: 'Clustering', description: 'Watch clusters form in real-time 3D', icon: Brain },
  ],
  'deep-learning': [
    { id: 'neural-networks', name: 'Neural Networks', description: '3D visualization of neural network architecture', icon: Network },
    { id: 'cnn', name: 'CNN Visualization', description: 'Explore convolutional layers in 3D', icon: Network },
    { id: 'rnn', name: 'RNN Visualization', description: 'Understand recurrent networks in 3D', icon: Network },
  ],
  genai: [
    { id: 'transformer', name: 'Transformer Model', description: '3D visualization of transformer architecture', icon: Sparkles },
    { id: 'attention', name: 'Attention Mechanism', description: 'See how attention works in 3D', icon: Sparkles },
    { id: 'llm', name: 'LLM Architecture', description: 'Explore large language model structure', icon: Sparkles },
  ],
};

export default function Simulators3DPage() {
  const router = useRouter();
  const currentSubjectId = 'python';
  const currentSubject = subjects.find(s => s.id === currentSubjectId) || subjects[0];
  const subjectSimulators = simulators[currentSubjectId] || [];

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Subject Navigation */}
        <div className="w-64 flex flex-col gap-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const returnUrl = sessionStorage.getItem('simulatorReturnUrl');
                if (returnUrl) {
                  router.push(returnUrl);
                } else {
                  router.back();
                }
              }
            }}
            className="inline-flex items-center gap-2 text-textSecondary hover:text-primary transition-colors bg-black rounded-lg border border-primary/20 p-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Topic</span>
          </button>
          <aside className="flex-1 bg-black rounded-lg border border-primary/20 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-text mb-4 px-2">Subjects</h3>
          <nav className="space-y-2">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              const isActive = currentSubjectId === subject.id;
              
              return (
                <div
                  key={subject.id}
                  onClick={() => router.push(subject.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary/20 text-primary shadow-glow'
                      : 'text-textSecondary hover:text-text hover:bg-card/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{subject.name}</span>
                </div>
              );
            })}
          </nav>
        </aside>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-black rounded-lg border border-primary/20 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const Icon = currentSubject.icon;
              return <Icon className="w-8 h-8 text-primary" />;
            })()}
            <h1 className="text-2xl font-bold text-text">{currentSubject.name} Simulators</h1>
          </div>

          <div className="space-y-4">
            <p className="text-textSecondary mb-6">
              Explore interactive 3D simulators for {currentSubject.name.toLowerCase()}. Click on any simulator below to get started.
            </p>

            {/* Simulator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectSimulators.map((simulator, index) => (
                <motion.div
                  key={simulator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-black rounded-lg border border-primary/20 p-4 cursor-pointer hover:border-primary/40 hover:shadow-glow transition-all overflow-hidden"
                  onClick={() => router.push(`/3d-simulators/${currentSubjectId}/${simulator.id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const SimIcon = simulator.icon;
                        return <SimIcon className="w-5 h-5 text-primary" />;
                      })()}
                    </div>
                    <h3 className="font-semibold text-text break-words min-w-0 flex-1">{simulator.name}</h3>
                  </div>
                  <p className="text-sm text-textSecondary break-words line-clamp-2">{simulator.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


