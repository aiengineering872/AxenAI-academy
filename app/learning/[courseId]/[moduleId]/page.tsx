'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// Dynamically import ModuleContent to ensure Firebase only loads on client
const ModuleContent = dynamic(() => import('./ModuleContent'), {
  ssr: false,
});

export default function ModulePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  
  return <ModuleContent courseId={courseId} moduleId={moduleId} />;
}

