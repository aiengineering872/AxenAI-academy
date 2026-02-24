'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

export default function CourseSubjectsPage({
  params,
}: {
  params: Promise<{ courseId?: string }>;
}) {
  const router = useRouter();
  const resolved = use(params);
  const courseId = resolved?.courseId || '';

  useEffect(() => {
    if (courseId) {
      router.replace(`/learning?course=${courseId}`);
    } else {
      router.replace('/learning');
    }
  }, [courseId, router]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-textSecondary">Loading subjects...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

