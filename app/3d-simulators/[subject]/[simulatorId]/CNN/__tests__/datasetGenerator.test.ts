/**
 * Unit tests for dataset generation utilities
 */
import {
  generateLinearDataset,
  generateCirclesDataset,
  generateMoonsDataset,
  generateSpiralDataset,
  generateDataset,
  normalizeData
} from '../utils/datasetGenerator';
import { DataPoint } from '../types';

describe('Dataset Generator', () => {
  describe('generateLinearDataset', () => {
    it('should generate the correct number of points', () => {
      const data = generateLinearDataset(100);
      expect(data).toHaveLength(100);
    });

    it('should generate points with x, y, and label properties', () => {
      const data = generateLinearDataset(10);
      data.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('label');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect([0, 1]).toContain(point.label);
      });
    });
  });

  describe('generateCirclesDataset', () => {
    it('should generate the correct number of points', () => {
      const data = generateCirclesDataset(100);
      expect(data).toHaveLength(100);
    });

    it('should generate points with binary labels', () => {
      const data = generateCirclesDataset(100);
      const labels = new Set(data.map(p => p.label));
      expect(labels.size).toBeLessThanOrEqual(2);
      data.forEach(point => {
        expect([0, 1]).toContain(point.label);
      });
    });
  });

  describe('generateMoonsDataset', () => {
    it('should generate the correct number of points', () => {
      const data = generateMoonsDataset(100);
      expect(data).toHaveLength(100);
    });

    it('should generate points with binary labels', () => {
      const data = generateMoonsDataset(100);
      data.forEach(point => {
        expect([0, 1]).toContain(point.label);
      });
    });
  });

  describe('generateSpiralDataset', () => {
    it('should generate the correct number of points', () => {
      const data = generateSpiralDataset(100);
      expect(data).toHaveLength(100);
    });

    it('should generate points with binary labels', () => {
      const data = generateSpiralDataset(100);
      data.forEach(point => {
        expect([0, 1]).toContain(point.label);
      });
    });
  });

  describe('generateDataset', () => {
    it('should generate linear dataset for "linear" type', () => {
      const data = generateDataset('linear', 50);
      expect(data).toHaveLength(50);
    });

    it('should generate circles dataset for "circles" type', () => {
      const data = generateDataset('circles', 50);
      expect(data).toHaveLength(50);
    });

    it('should generate moons dataset for "moons" type', () => {
      const data = generateDataset('moons', 50);
      expect(data).toHaveLength(50);
    });

    it('should generate spiral dataset for "spiral" type', () => {
      const data = generateDataset('spiral', 50);
      expect(data).toHaveLength(50);
    });

    it('should default to linear for unknown types', () => {
      const data = generateDataset('unknown', 50);
      expect(data).toHaveLength(50);
    });
  });

  describe('normalizeData', () => {
    it('should normalize data to [-1, 1] range', () => {
      const data: DataPoint[] = [
        { x: 0, y: 0, label: 0 },
        { x: 10, y: 10, label: 1 },
        { x: 5, y: 5, label: 0 }
      ];
      const result = normalizeData(data);
      
      expect(result.data).toHaveLength(3);
      result.data.forEach(point => {
        expect(point.x).toBeGreaterThanOrEqual(-1);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(-1);
        expect(point.y).toBeLessThanOrEqual(1);
      });
    });

    it('should preserve labels', () => {
      const data: DataPoint[] = [
        { x: 0, y: 0, label: 0 },
        { x: 10, y: 10, label: 1 }
      ];
      const result = normalizeData(data);
      
      expect(result.data[0].label).toBe(0);
      expect(result.data[1].label).toBe(1);
    });

    it('should handle empty array', () => {
      const result = normalizeData([]);
      expect(result.data).toHaveLength(0);
    });

    it('should return min/max values', () => {
      const data: DataPoint[] = [
        { x: 0, y: 0, label: 0 },
        { x: 10, y: 20, label: 1 }
      ];
      const result = normalizeData(data);
      
      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(10);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(20);
    });
  });
});

