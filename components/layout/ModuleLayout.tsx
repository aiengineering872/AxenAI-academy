'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleSidebar } from './ModuleSidebar';

interface Module {
  id: string;
  number: string;
  name: string;
  order: number;
  topics: Array<{
    id: string;
    name: string;
    content: string;
    order: number;
  }>;
}

interface ModuleLayoutProps {
  children: ReactNode;
  courseId: string;
  moduleId: string;
  currentLessonIndex: number;
  onLessonClick: (index: number) => void;
  moduleTitle?: string;
  modules?: Module[];
  selectedModuleIndex?: number | null;
  onModuleSelect?: (index: number) => void;
  courseTitle?: string;
}

export const ModuleLayout: React.FC<ModuleLayoutProps> = ({
  children,
  courseId,
  moduleId,
  currentLessonIndex,
  onLessonClick,
  moduleTitle,
  modules,
  selectedModuleIndex,
  onModuleSelect,
  courseTitle,
}) => {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user && !firebaseUser) {
      router.replace('/auth/login');
    }
  }, [loading, user, firebaseUser, router]);

  const formatPathname = () => {
    if (!pathname || pathname === '/') return 'Dashboard';
    
    // Build breadcrumb with actual names instead of IDs
    const parts: string[] = ['Learning'];
    
    if (courseTitle) {
      parts.push(courseTitle);
    } else if (pathname.includes('/learning/')) {
      parts.push('Course');
    }
    
    if (moduleTitle) {
      parts.push(moduleTitle);
    } else if (pathname.includes('/learning/') && pathname.split('/').length > 3) {
      parts.push('Subject');
    }
    
    return parts.join(' › ');
  };

  const pageTitle = formatPathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text">
        Loading...
      </div>
    );
  }

  if (!user && !firebaseUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen md:h-screen bg-background md:overflow-hidden">
      <ModuleSidebar
        moduleId={moduleId}
        courseId={courseId}
        currentLessonIndex={currentLessonIndex}
        onLessonClick={onLessonClick}
        moduleTitle={moduleTitle}
        modules={modules}
        selectedModuleIndex={selectedModuleIndex}
        onModuleSelect={onModuleSelect}
      />
      
      <main className="flex-1 min-h-screen md:max-h-screen overflow-x-hidden overflow-y-visible md:overflow-y-auto relative z-10">
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b border-card md:mt-0 mt-16">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-textSecondary">Current view</p>
              <h2 className="text-lg font-semibold text-text">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-3">
              {(user || firebaseUser) && (
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-text">
                    {user?.displayName ||
                      firebaseUser?.displayName ||
                      user?.email ||
                      firebaseUser?.email ||
                      ''}
                  </span>
                  <span className="text-xs text-textSecondary">Learner</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 relative z-10">{children}</div>
      </main>
    </div>
  );
};

