'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

export default function CourseSubjectsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  useEffect(() => {
    if (courseId) {
      // Redirect to learning page with course selected via query parameter
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

