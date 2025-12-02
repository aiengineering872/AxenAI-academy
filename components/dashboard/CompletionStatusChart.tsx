'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';

interface CompletionSlice {
  name: string;
  value: number;
  color: string;
}

interface CompletionStatusChartProps {
  data: CompletionSlice[];
}

const tooltipStyles = {
  backgroundColor: 'rgba(30, 30, 40, 0.95)',
  border: '1px solid rgba(100, 100, 120, 0.3)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#fff',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={tooltipStyles}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {data.name}: {data.value}%
        </p>
      </div>
    );
  }
  return null;
};

const CompletionStatusChart: React.FC<CompletionStatusChartProps> = ({ data }) => {
  // Filter out zero values for better visualization
  const filteredData = data.filter(item => item.value > 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={filteredData.length > 0 ? filteredData : data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {(filteredData.length > 0 ? filteredData : data).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Custom Legend */}
      <div className="mt-4 space-y-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-textSecondary">{entry.name}</span>
            </div>
            <span className="text-text font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletionStatusChart;

