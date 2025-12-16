'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Code, Brain, Network, Sparkles, ArrowLeft, Database } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MLSimulator = dynamic(() => import('./[simulatorId]/MLSimulator'), {
  ssr: false,
});

const subjects = [
  { id: 'python', name: 'Python', icon: Code },
  { id: 'machine-learning', name: 'Machine Learning', icon: Brain },
  { id: 'deep-learning', name: 'Deep Learning', icon: Network },
  { id: 'genai', name: 'GenAI', icon: Sparkles },
];

const deepLearningSimulators = [
  { 
    id: 'cnn', 
    name: 'CNN Simulator', 
    description: 'Convolutional Neural Network for image processing and feature extraction',
    icon: Network 
  },
  { 
    id: 'ann', 
    name: 'ANN Simulator', 
    description: 'Artificial Neural Network with decision boundary visualization',
    icon: Brain 
  },
];

const pythonSimulators = [
  { 
    id: 'pandas-dataframe', 
    name: 'Pandas DataFrame Simulator', 
    description: 'Visualize how Pandas creates, filters, groups, and transforms DataFrames',
    icon: Code 
  },
  { 
    id: 'python-memory', 
    name: 'Python Memory & Variable Flow Simulator', 
    description: 'Visualize how Python stores variables in memory, handles references, and manages mutability',
    icon: Brain 
  },
];

const genAISimulators = [
  { 
    id: 'prompt-engineering', 
    name: 'Prompt Engineering Simulator', 
    description: 'Experiment with prompts and see how parameters affect AI outputs',
    icon: Sparkles 
  },
  { 
    id: 'rag-pipeline', 
    name: 'RAG Pipeline Simulator', 
    description: 'Visualize how Retrieval-Augmented Generation works step-by-step',
    icon: Database 
  },
];


export default function SubjectSimulatorsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subject as string || 'python';
  
  const currentSubject = subjects.find(s => s.id === subjectId) || subjects[0];

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
              const isActive = subjectId === subject.id;
              
              return (
                <div
                  key={subject.id}
                  onClick={() => router.push(`/3d-simulators/${subject.id}`)}
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
          {subjectId === 'machine-learning' ? (
            <MLSimulator />
          ) : subjectId === 'deep-learning' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = currentSubject.icon;
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
                <h1 className="text-2xl font-bold text-text">{currentSubject.name} Simulators</h1>
              </div>

              <div className="space-y-4">
                <p className="text-textSecondary mb-6">
                  Explore interactive deep learning simulators. Click on any simulator below to get started.
                </p>

                {/* Deep Learning Simulator Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deepLearningSimulators.map((simulator) => (
                    <div
                      key={simulator.id}
                      className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20 cursor-pointer hover:border-primary/40 hover:shadow-glow transition-all"
                      onClick={() => router.push(`/3d-simulators/${subjectId}/${simulator.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const SimIcon = simulator.icon;
                            return <SimIcon className="w-6 h-6 text-primary" />;
                          })()}
                        </div>
                        <h3 className="font-semibold text-text text-lg">{simulator.name}</h3>
                      </div>
                      <p className="text-sm text-textSecondary">{simulator.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : subjectId === 'python' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = currentSubject.icon;
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
                <h1 className="text-2xl font-bold text-text">{currentSubject.name} Simulators</h1>
              </div>

              <div className="space-y-4">
                <p className="text-textSecondary mb-6">
                  Explore interactive Python simulators. Click on any simulator below to get started.
                </p>

                {/* Python Simulator Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pythonSimulators.map((simulator) => (
                    <div
                      key={simulator.id}
                      className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20 cursor-pointer hover:border-primary/40 hover:shadow-glow transition-all"
                      onClick={() => router.push(`/3d-simulators/${subjectId}/${simulator.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const SimIcon = simulator.icon;
                            return <SimIcon className="w-6 h-6 text-primary" />;
                          })()}
                        </div>
                        <h3 className="font-semibold text-text text-lg">{simulator.name}</h3>
                      </div>
                      <p className="text-sm text-textSecondary">{simulator.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : subjectId === 'genai' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = currentSubject.icon;
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
                <h1 className="text-2xl font-bold text-text">{currentSubject.name} Simulators</h1>
              </div>

              <div className="space-y-4">
                <p className="text-textSecondary mb-6">
                  Explore interactive GenAI simulators. Click on any simulator below to get started.
                </p>

                {/* GenAI Simulator Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {genAISimulators.map((simulator) => (
                    <div
                      key={simulator.id}
                      className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20 cursor-pointer hover:border-primary/40 hover:shadow-glow transition-all"
                      onClick={() => router.push(`/3d-simulators/${subjectId}/${simulator.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const SimIcon = simulator.icon;
                            return <SimIcon className="w-6 h-6 text-primary" />;
                          })()}
                        </div>
                        <h3 className="font-semibold text-text text-lg">{simulator.name}</h3>
                      </div>
                      <p className="text-sm text-textSecondary">{simulator.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = currentSubject.icon;
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
                <h1 className="text-2xl font-bold text-text">{currentSubject.name} Simulators</h1>
              </div>

              <div className="space-y-4">
                <p className="text-textSecondary mb-6">
                  Interactive 3D simulators for {currentSubject.name.toLowerCase()} coming soon.
                </p>
                
                <div className="bg-black rounded-lg border border-primary/20 p-8 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-primary/20 flex items-center justify-center">
                      {(() => {
                        const Icon = currentSubject.icon;
                        return <Icon className="w-12 h-12 text-primary" />;
                      })()}
                    </div>
                    <h3 className="text-xl font-semibold text-text mb-2">Coming Soon</h3>
                    <p className="text-textSecondary">
                      Interactive 3D simulators for {currentSubject.name.toLowerCase()} are currently in development.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


