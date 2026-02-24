'use client';

import { use } from 'react';
import DashboardContent from './DashboardContent';

export default function ModuleDashboardPage({
  params,
}: {
  params: Promise<{ moduleId?: string }>;
}) {
  const resolved = use(params);
  const moduleId = resolved?.moduleId || '';
  return <DashboardContent moduleId={moduleId} />;
}

