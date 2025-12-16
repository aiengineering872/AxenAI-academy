/**
 * Dataset generation utilities for Neural Network Playground
 */

import { DataPoint } from '../types';

/**
 * Generates a linear dataset with two classes
 */
export function generateLinearDataset(n: number = 200): DataPoint[] {
  const data: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 4 - 2;
    const label = x + y > 0 ? 1 : 0;
    data.push({ x, y, label });
  }
  return data;
}

/**
 * Generates a circles dataset (concentric circles)
 */
export function generateCirclesDataset(n: number = 200, noise: number = 0.1): DataPoint[] {
  const data: DataPoint[] = [];
  const nOuter = Math.floor(n / 2);
  const nInner = n - nOuter;

  // Outer circle
  for (let i = 0; i < nOuter; i++) {
    const angle = (Math.PI * 2 * i) / nOuter;
    const radius = 0.8 + (Math.random() - 0.5) * noise;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    data.push({ x, y, label: 0 });
  }

  // Inner circle
  for (let i = 0; i < nInner; i++) {
    const angle = (Math.PI * 2 * i) / nInner;
    const radius = 0.3 + (Math.random() - 0.5) * noise;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    data.push({ x, y, label: 1 });
  }

  return shuffleArray(data);
}

/**
 * Generates a moons dataset (two interleaving half-circles)
 */
export function generateMoonsDataset(n: number = 200, noise: number = 0.1): DataPoint[] {
  const data: DataPoint[] = [];
  const nPerMoon = Math.floor(n / 2);

  // First moon
  for (let i = 0; i < nPerMoon; i++) {
    const angle = (Math.PI * i) / nPerMoon;
    const x = Math.cos(angle) + (Math.random() - 0.5) * noise;
    const y = Math.sin(angle) + (Math.random() - 0.5) * noise;
    data.push({ x, y, label: 0 });
  }

  // Second moon
  for (let i = 0; i < nPerMoon; i++) {
    const angle = (Math.PI * i) / nPerMoon;
    const x = 1 - Math.cos(angle) + (Math.random() - 0.5) * noise;
    const y = 0.5 - Math.sin(angle) + (Math.random() - 0.5) * noise;
    data.push({ x, y, label: 1 });
  }

  return shuffleArray(data);
}

/**
 * Generates a spiral dataset
 */
export function generateSpiralDataset(n: number = 200, noise: number = 0.1): DataPoint[] {
  const data: DataPoint[] = [];
  const nPerSpiral = Math.floor(n / 2);

  // First spiral
  for (let i = 0; i < nPerSpiral; i++) {
    const t = (i / nPerSpiral) * 4 * Math.PI;
    const r = t / (4 * Math.PI);
    const x = r * Math.cos(t) + (Math.random() - 0.5) * noise;
    const y = r * Math.sin(t) + (Math.random() - 0.5) * noise;
    data.push({ x, y, label: 0 });
  }

  // Second spiral
  for (let i = 0; i < nPerSpiral; i++) {
    const t = (i / nPerSpiral) * 4 * Math.PI;
    const r = t / (4 * Math.PI);
    const x = -r * Math.cos(t) + (Math.random() - 0.5) * noise;
    const y = -r * Math.sin(t) + (Math.random() - 0.5) * noise;
    data.push({ x, y, label: 1 });
  }

  return shuffleArray(data);
}

/**
 * Shuffles an array in place
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Normalizes data points to [-1, 1] range
 */
export function normalizeData(data: DataPoint[]): { data: DataPoint[]; minX: number; maxX: number; minY: number; maxY: number } {
  if (data.length === 0) {
    return { data: [], minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const normalized = data.map(point => ({
    x: ((point.x - minX) / rangeX) * 2 - 1,
    y: ((point.y - minY) / rangeY) * 2 - 1,
    label: point.label
  }));

  return { data: normalized, minX, maxX, minY, maxY };
}

/**
 * Generates dataset based on type
 */
export function generateDataset(type: string, n: number = 200): DataPoint[] {
  switch (type) {
    case 'linear':
      return generateLinearDataset(n);
    case 'circles':
      return generateCirclesDataset(n);
    case 'moons':
      return generateMoonsDataset(n);
    case 'spiral':
      return generateSpiralDataset(n);
    default:
      return generateLinearDataset(n);
  }
}

