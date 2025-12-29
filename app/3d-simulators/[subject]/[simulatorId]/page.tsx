'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Code, Brain, Network, Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MLSimulator = dynamic(() => import('./MLSimulator'), {
  ssr: false,
});

const CNNSimulator = dynamic(() => import('./CNNSimulator'), {
  ssr: false,
});

const ANNSimulator = dynamic(() => import('./ANNSimulator'), {
  ssr: false,
});

const PythonSimulator = dynamic(() => import('./PythonSimulator'), {
  ssr: false,
});

const PythonMemoryManagerSimulator = dynamic(() => import('./PythonMemoryManagerSimulator'), {
  ssr: false,
});

const PromptEngineeringSimulator = dynamic(() => import('./PromptEngineeringSimulator'), {
  ssr: false,
});

const RAGSimulator = dynamic(() => import('./RAGSimulator'), {
  ssr: false,
});

const subjects = [
  { id: 'python', name: 'Python', icon: Code },
  { id: 'machine-learning', name: 'Machine Learning', icon: Brain },
  { id: 'deep-learning', name: 'Deep Learning', icon: Network },
  { id: 'genai', name: 'GenAI', icon: Sparkles },
];

export default function SimulatorPage() {
  const router = useRouter();
  const params = useParams();
  // Access params directly - useParams() in client components is synchronous
  const subjectId = (params?.subject as string) || 'python';
  const simulatorId = (params?.simulatorId as string) || '';
  
  const currentSubject = subjects.find(s => s.id === subjectId) || subjects[0];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-200px)]">
        {/* Main Content Area - Full Width (No Sidebar) */}
        <div className="bg-black rounded-lg border border-primary/20 p-6 overflow-y-auto h-full">
          <div className="mb-4">
            <Link 
              href={`/3d-simulators/${subjectId}`}
              className="inline-flex items-center gap-2 text-textSecondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {currentSubject.name} Simulators</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const Icon = currentSubject.icon;
              return <Icon className="w-8 h-8 text-primary" />;
            })()}
            <h1 className="text-2xl font-bold text-text">
              {simulatorId === 'ann'
                ? 'ANN'
                : simulatorId === 'prompt-engineering'
                ? 'Prompt Engineering'
                : simulatorId === 'rag-pipeline'
                ? 'RAG Pipeline'
                : simulatorId === 'python-memory-manager'
                ? 'Python Memory Manager'
                : simulatorId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              {' '}Simulator
            </h1>
          </div>

          <div className="space-y-4">
            {subjectId === 'machine-learning' ? (
              <MLSimulator />
            ) : subjectId === 'deep-learning' && simulatorId === 'cnn' ? (
              <CNNSimulator />
            ) : subjectId === 'deep-learning' && simulatorId === 'ann' ? (
              <ANNSimulator />
            ) : subjectId === 'python' && simulatorId === 'python-memory-manager' ? (
              <PythonMemoryManagerSimulator />
            ) : subjectId === 'python' && (simulatorId === 'pandas-dataframe' || simulatorId === 'python-basics' || simulatorId === 'data-structures' || simulatorId === 'algorithms') ? (
              <PythonSimulator />
            ) : subjectId === 'genai' && simulatorId === 'prompt-engineering' ? (
              <PromptEngineeringSimulator />
            ) : subjectId === 'genai' && simulatorId === 'rag-pipeline' ? (
              <RAGSimulator />
            ) : (
              <div className="bg-black rounded-lg border border-primary/20 p-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-primary/20 flex items-center justify-center">
                    {(() => {
                      const Icon = currentSubject.icon;
                      return <Icon className="w-12 h-12 text-primary" />;
                    })()}
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-2">3D Simulator Coming Soon</h3>
                  <p className="text-textSecondary">
                    The interactive 3D visualization for this simulator will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

