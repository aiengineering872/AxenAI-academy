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

const subjects = [
  { id: 'python', name: 'Python', icon: Code },
  { id: 'machine-learning', name: 'Machine Learning', icon: Brain },
  { id: 'deep-learning', name: 'Deep Learning', icon: Network },
  { id: 'genai', name: 'GenAI', icon: Sparkles },
];

export default function SimulatorPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.subject as string || 'python';
  const simulatorId = params?.simulatorId as string || '';
  
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
              {simulatorId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Simulator
            </h1>
          </div>

          <div className="space-y-4">
            {subjectId === 'machine-learning' ? (
              <MLSimulator />
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


