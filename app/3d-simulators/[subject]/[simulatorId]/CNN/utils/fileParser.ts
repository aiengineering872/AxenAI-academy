/**
 * File parsing utilities for CSV and Excel files
 */

import { DataPoint } from '../types';

/**
 * Result type for file parsing
 */
export type ParseFileResult = 
  | { data: DataPoint[]; error?: never }
  | { data?: never; error: { message: string } };

/**
 * Type guard to check if result has error
 */
export function hasError(result: ParseFileResult): result is { data?: never; error: { message: string } } {
  return 'error' in result && result.error !== undefined;
}

/**
 * Parses CSV or Excel file and extracts data points
 */
export async function parseFile(file: File): Promise<ParseFileResult> {
  const fileType = file.name.split('.').pop()?.toLowerCase();
  
  try {
    let data: DataPoint[];
  
  if (fileType === 'csv') {
      data = await parseCSV(file);
  } else if (fileType === 'xlsx' || fileType === 'xls') {
      data = await parseExcel(file);
  } else {
      return { error: { message: 'Unsupported file format. Please upload a CSV or Excel file.' } };
    }
    
    return { data };
  } catch (error: any) {
    return { error: { message: error?.message || 'Failed to parse file.' } };
  }
}

/**
 * Parses CSV file
 */
async function parseCSV(file: File): Promise<DataPoint[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header row and one data row.');
        }
        
        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const xIndex = headers.findIndex(h => h.includes('x'));
        const yIndex = headers.findIndex(h => h.includes('y'));
        const labelIndex = headers.findIndex(h => 
          h.includes('label') || h.includes('class') || h.includes('target')
        );
        
        if (xIndex === -1 || yIndex === -1 || labelIndex === -1) {
          throw new Error('CSV must have columns: x, y, and label (or class/target)');
        }
        
        // Parse data
        const data: DataPoint[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const x = parseFloat(values[xIndex]);
          const y = parseFloat(values[yIndex]);
          const label = parseInt(values[labelIndex]);
          
          if (!isNaN(x) && !isNaN(y) && !isNaN(label)) {
            data.push({ x, y, label });
          }
        }
        
        if (data.length === 0) {
          throw new Error('No valid data found in CSV file.');
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

/**
 * Parses Excel file
 */
async function parseExcel(file: File): Promise<DataPoint[]> {
  try {
    // Dynamic import to reduce bundle size
    const XLSX = await import('xlsx');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            throw new Error('Excel file is empty.');
          }
          
          // Parse data points
          const points: DataPoint[] = [];
          for (const row of jsonData as any[]) {
            // Find x, y, label columns (case-insensitive)
            const keys = Object.keys(row);
            const xKey = keys.find(k => k.toLowerCase().includes('x'));
            const yKey = keys.find(k => k.toLowerCase().includes('y'));
            const labelKey = keys.find(k => 
              k.toLowerCase().includes('label') || 
              k.toLowerCase().includes('class') ||
              k.toLowerCase().includes('target')
            );
            
            if (!xKey || !yKey || !labelKey) {
              continue;
            }
            
            const x = parseFloat(row[xKey]);
            const y = parseFloat(row[yKey]);
            const label = parseInt(row[labelKey]);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(label)) {
              points.push({ x, y, label });
            }
          }
          
          if (points.length === 0) {
            throw new Error('No valid data found in Excel file.');
          }
          
          resolve(points);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsBinaryString(file);
    });
  } catch (error) {
    throw new Error('Failed to load Excel parser. Please try CSV format instead.');
  }
}

