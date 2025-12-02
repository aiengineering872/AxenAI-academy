'use client';

import React, { ReactNode, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Loader2 } from 'lucide-react';

const formatPathname = (pathname: string) => {
  if (!pathname || pathname === '/') return 'Dashboard';
  const parts = pathname.replace(/^\//, '').split('/');
  return parts
    .map((part) => part.replace(/-/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' › ');
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, firebaseUser, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !firebaseUser) {
      router.replace('/auth/login');
    }
  }, [loading, user, firebaseUser, router]);

  const pageTitle = useMemo(() => formatPathname(pathname || ''), [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-textSecondary text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user && !firebaseUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 overflow-x-hidden md:ml-0 relative z-10">
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
                  <span className="text-xs text-textSecondary">
                    {isAdmin ? 'Administrator' : 'Learner'}
                  </span>
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
                >
                  <Settings className="h-4 w-4" />
                  Admin Settings
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 relative z-10">{children}</div>
      </main>
    </div>
  );
};

