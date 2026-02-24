'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const ModuleContent = dynamic(() => import('./ModuleContent'), {
  ssr: false,
});

export default function ModulePage({
  params,
}: {
  params: Promise<{ courseId?: string; moduleId?: string }>;
}) {
  const resolved = use(params);
  const courseId = resolved?.courseId || '';
  const moduleId = resolved?.moduleId || '';

  if (!courseId || !moduleId) {
    return null;
  }

  return <ModuleContent courseId={courseId} moduleId={moduleId} />;
}

