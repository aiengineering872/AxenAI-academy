'use client';

import React from 'react';

interface ChartSkeletonProps {
  height?: number;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 300 }) => {
  return (
    <div
      className="w-full rounded-xl bg-card/70 border border-card/60 animate-pulse"
      style={{ height }}
    >
      <div className="h-full w-full bg-gradient-to-r from-card/70 via-card to-card/70 rounded-xl" />
    </div>
  );
};

export default ChartSkeleton;

