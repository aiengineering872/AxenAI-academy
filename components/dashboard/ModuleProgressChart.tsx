'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ModuleProgressChartProps {
  data: Array<{ name: string; progress: number }>;
}

const tooltipStyles = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-card)',
  borderRadius: '8px',
};

const ModuleProgressChart: React.FC<ModuleProgressChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis dataKey="name" stroke="currentColor" />
        <YAxis stroke="currentColor" />
        <Tooltip contentStyle={tooltipStyles} />
        <Bar dataKey="progress" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ModuleProgressChart;

