'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, Cell } from 'recharts';
import { Play, RotateCcw, ChevronDown, Activity, TrendingUp, Layers } from 'lucide-react';

const MLSimulator = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('linear-regression');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    mse: 0,
    r2Score: 0
  });
  const [confusionMatrix, setConfusionMatrix] = useState({ tp: 0, fp: 0, tn: 0, fn: 0 });
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editableMatrix, setEditableMatrix] = useState({ tp: 45, fp: 8, tn: 35, fn: 12 });
  const [dataSize, setDataSize] = useState(50);
  const [noiseLevel, setNoiseLevel] = useState(2);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const algorithms = [
    { id: 'linear-regression', name: 'Linear Regression', icon: TrendingUp, color: '#3b82f6' },
    { id: 'logistic-regression', name: 'Logistic Regression', icon: Activity, color: '#8b5cf6' },
    { id: 'decision-tree', name: 'Decision Tree', icon: Layers, color: '#10b981' },
    { id: 'knn', name: 'K-Nearest Neighbors', icon: Activity, color: '#f59e0b' },
    { id: 'svm', name: 'Support Vector Machine', icon: TrendingUp, color: '#ef4444' }
  ];

  const generateData = (algorithm: string): { data: any[], calculatedMetrics: typeof metrics, confusionMatrix?: { tp: number, fp: number, tn: number, fn: number } } => {
    const data: any[] = [];
    const n = dataSize;
    const actualLabels: number[] = [];
    const predictedLabels: number[] = [];
    const actualValues: number[] = [];
    const predictedValues: number[] = [];
    let calculatedMetrics = { ...metrics };
    let calculatedConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
    
    switch(algorithm) {
      case 'linear-regression': {
        // Generate data with linear relationship
        const slope = 2.5;
        const intercept = 3;
        for (let i = 0; i < n; i++) {
          const x = i / n * 10;
          const noise = (Math.random() - 0.5) * noiseLevel;
          const y = slope * x + intercept + noise;
          const predicted = slope * x + intercept;
          actualValues.push(y);
          predictedValues.push(predicted);
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), predicted: parseFloat(predicted.toFixed(2)) });
        }
        // Calculate real MSE and R²
        const mse = actualValues.reduce((sum, val, idx) => sum + Math.pow(val - predictedValues[idx], 2), 0) / n;
        const meanActual = actualValues.reduce((sum, val) => sum + val, 0) / n;
        const ssTotal = actualValues.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
        const ssResidual = actualValues.reduce((sum, val, idx) => sum + Math.pow(val - predictedValues[idx], 2), 0);
        const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
        
        calculatedMetrics = {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          mse: parseFloat(mse.toFixed(3)),
          r2Score: parseFloat(Math.max(0, Math.min(1, r2)).toFixed(3))
        };
        setMetrics(calculatedMetrics);
        break;
      }
      case 'logistic-regression': {
        // Generate separable data with some noise
        for (let i = 0; i < n; i++) {
          const x = (Math.random() - 0.5) * 10;
          const y = (Math.random() - 0.5) * 10;
          const decisionBoundary = x + y;
          const noise = (Math.random() - 0.5) * noiseLevel;
          const actualLabel = decisionBoundary + noise > 0 ? 1 : 0;
          
          // Logistic regression prediction (sigmoid function)
          const z = decisionBoundary;
          const probability = 1 / (1 + Math.exp(-z));
          const predictedLabel = probability > 0.5 ? 1 : 0;
          
          actualLabels.push(actualLabel);
          predictedLabels.push(predictedLabel);
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            y: parseFloat(y.toFixed(2)), 
            class: actualLabel, 
            predicted: predictedLabel 
          });
        }
        break;
      }
      case 'svm': {
        // Generate data with clear separation
        for (let i = 0; i < n; i++) {
          const x = (Math.random() - 0.5) * 10;
          const y = (Math.random() - 0.5) * 10;
          const margin = x + y;
          const noise = (Math.random() - 0.5) * noiseLevel * 0.5;
          const actualLabel = margin + noise > 0 ? 1 : 0;
          
          // SVM prediction (linear decision boundary)
          const predictedLabel = margin > 0 ? 1 : 0;
          
          actualLabels.push(actualLabel);
          predictedLabels.push(predictedLabel);
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            y: parseFloat(y.toFixed(2)), 
            class: actualLabel, 
            predicted: predictedLabel 
          });
        }
        break;
      }
      case 'decision-tree': {
        // Generate data with decision boundaries
        for (let i = 0; i < n; i++) {
          const x = Math.random() * 10;
          const y = Math.random() * 10;
          const actualLabel = (x > 5 && y > 5) || (x < 5 && y < 5) ? 1 : 0;
          
          // Decision tree prediction (simple rule-based)
          const predictedLabel = (x > 5 && y > 5) || (x < 5 && y < 5) ? 1 : 0;
          // Add some prediction errors based on noise
          const error = Math.random() < (noiseLevel / 10) ? 1 : 0;
          const finalPrediction = error ? (1 - predictedLabel) : predictedLabel;
          
          actualLabels.push(actualLabel);
          predictedLabels.push(finalPrediction);
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            y: parseFloat(y.toFixed(2)), 
            class: actualLabel, 
            predicted: finalPrediction 
          });
        }
        break;
      }
      case 'knn': {
        // Generate data with clusters first, then predict
        const allPoints: Array<{x: number, y: number, label: number}> = [];
        
        // First, generate all actual data points
        for (let i = 0; i < n; i++) {
          const x = Math.random() * 10;
          const y = Math.random() * 10;
          const actualLabel = (x > 5 && y > 5) || (x < 5 && y < 5) ? 1 : 0;
          allPoints.push({ x, y, label: actualLabel });
          actualLabels.push(actualLabel);
        }
        
        // Then, predict using KNN for each point
        const k = 5;
        for (let i = 0; i < n; i++) {
          const point = allPoints[i];
          const distances: Array<{dist: number, label: number}> = [];
          
          // Calculate distances to all other points
          for (let j = 0; j < n; j++) {
            if (i !== j) {
              const dist = Math.sqrt(Math.pow(point.x - allPoints[j].x, 2) + Math.pow(point.y - allPoints[j].y, 2));
              distances.push({ dist, label: allPoints[j].label });
            }
          }
          
          // Sort by distance and get k nearest
          distances.sort((a, b) => a.dist - b.dist);
          const nearest = distances.slice(0, k);
          const votes = nearest.reduce((sum, n) => sum + n.label, 0);
          const predictedLabel = votes > k / 2 ? 1 : 0;
          
          predictedLabels.push(predictedLabel);
          data.push({ 
            x: parseFloat(point.x.toFixed(2)), 
            y: parseFloat(point.y.toFixed(2)), 
            class: point.label, 
            predicted: predictedLabel 
          });
        }
        break;
      }
    }
    
    // Calculate classification metrics if applicable
    if (actualLabels.length > 0 && predictedLabels.length > 0) {
      let tp = 0, fp = 0, tn = 0, fn = 0;
      for (let i = 0; i < actualLabels.length; i++) {
        if (actualLabels[i] === 1 && predictedLabels[i] === 1) tp++;
        else if (actualLabels[i] === 0 && predictedLabels[i] === 1) fp++;
        else if (actualLabels[i] === 0 && predictedLabels[i] === 0) tn++;
        else if (actualLabels[i] === 1 && predictedLabels[i] === 0) fn++;
      }
      
      calculatedConfusionMatrix = { tp, fp, tn, fn };
      setConfusionMatrix(calculatedConfusionMatrix);
      setEditableMatrix(calculatedConfusionMatrix);
      
      const total = tp + fp + tn + fn;
      const accuracy = total > 0 ? ((tp + tn) / total * 100) : 0;
      const precision = (tp + fp) > 0 ? (tp / (tp + fp) * 100) : 0;
      const recall = (tp + fn) > 0 ? (tp / (tp + fn) * 100) : 0;
      const f1 = (precision + recall) > 0 ? (2 * (precision * recall) / (precision + recall)) : 0;
      
      calculatedMetrics = {
        accuracy: parseFloat(accuracy.toFixed(1)),
        precision: parseFloat(precision.toFixed(1)),
        recall: parseFloat(recall.toFixed(1)),
        f1Score: parseFloat(f1.toFixed(1)),
        mse: 0,
        r2Score: 0
      };
      setMetrics(calculatedMetrics);
    }
    
    return { 
      data, 
      calculatedMetrics,
      confusionMatrix: actualLabels.length > 0 ? calculatedConfusionMatrix : undefined
    };
  };

  const runSimulation = () => {
    setIsRunning(true);
    setProgress(0);
    
    // Generate data first to get real metrics
    const { data, calculatedMetrics } = generateData(selectedAlgorithm);
    setTrainingData(data);
    
    // Use the calculated metrics directly (not from state)
    const targetMetrics = calculatedMetrics;
    const isClassification = ['logistic-regression', 'decision-tree', 'knn', 'svm'].includes(selectedAlgorithm);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          // Ensure final metrics are set correctly
          setMetrics(targetMetrics);
          return 100;
        }
        
        // Update metrics progressively during training (simulate learning curve)
        const progressRatio = newProgress / 100;
        
        // Ease-in-out curve for more realistic progression
        const easeProgress = progressRatio < 0.5 
          ? 2 * progressRatio * progressRatio 
          : 1 - Math.pow(-2 * progressRatio + 2, 2) / 2;
        
        if (isClassification) {
          // Simulate gradual improvement from random (50%) to final metrics
          const targetAccuracy = targetMetrics.accuracy || 50;
          const targetPrecision = targetMetrics.precision || 50;
          const targetRecall = targetMetrics.recall || 50;
          const targetF1 = targetMetrics.f1Score || 50;
          
          setMetrics({
            accuracy: parseFloat((50 + (targetAccuracy - 50) * easeProgress).toFixed(1)),
            precision: parseFloat((50 + (targetPrecision - 50) * easeProgress).toFixed(1)),
            recall: parseFloat((50 + (targetRecall - 50) * easeProgress).toFixed(1)),
            f1Score: parseFloat((50 + (targetF1 - 50) * easeProgress).toFixed(1)),
            mse: 0,
            r2Score: 0
          });
        } else {
          // Regression metrics - improve gradually
          const targetMSE = targetMetrics.mse || 5;
          const targetR2 = targetMetrics.r2Score || 0.5;
          
          // MSE should decrease, R2 should increase
          setMetrics({
            accuracy: 0,
            precision: 0,
            recall: 0,
            f1Score: 0,
            mse: parseFloat((5 - (5 - targetMSE) * easeProgress).toFixed(3)),
            r2Score: parseFloat((0.5 + (targetR2 - 0.5) * easeProgress).toFixed(3))
          });
        }
        
        return newProgress;
      });
    }, 50);
  };

  const reset = () => {
    setProgress(0);
    setMetrics({ accuracy: 0, precision: 0, recall: 0, f1Score: 0, mse: 0, r2Score: 0 });
    setConfusionMatrix({ tp: 0, fp: 0, tn: 0, fn: 0 });
    setTrainingData([]);
  };

  const handleMatrixChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const newMatrix = { ...editableMatrix, [field]: numValue };
    setEditableMatrix(newMatrix);
    
    // Recalculate metrics immediately
    const { tp, fp, tn, fn } = newMatrix;
    const total = tp + fp + tn + fn;
    
    if (total > 0) {
      const accuracy = ((tp + tn) / total * 100).toFixed(1);
      const precision = tp + fp > 0 ? (tp / (tp + fp) * 100).toFixed(1) : '0';
      const recall = tp + fn > 0 ? (tp / (tp + fn) * 100).toFixed(1) : '0';
      const f1 = parseFloat(precision) + parseFloat(recall) > 0 
        ? (2 * (parseFloat(precision) * parseFloat(recall)) / (parseFloat(precision) + parseFloat(recall))).toFixed(1) 
        : '0';
      
      setMetrics({
        accuracy: parseFloat(accuracy),
        precision: parseFloat(precision),
        recall: parseFloat(recall),
        f1Score: parseFloat(f1),
        mse: 0,
        r2Score: 0
      });
      
      setConfusionMatrix(newMatrix);
    }
  };

  const selectedAlgo = algorithms.find(a => a.id === selectedAlgorithm);
  const isClassification = ['logistic-regression', 'decision-tree', 'knn', 'svm'].includes(selectedAlgorithm);

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            3D Machine Learning Simulator
          </h1>
          <p className="text-textSecondary">Visualize and understand ML algorithms in real-time</p>
        </div>

        {/* Algorithm Selector */}
        <div className="bg-card/50 backdrop-blur rounded-xl p-6 mb-6 border border-primary/20 relative z-30">
          <label className="block text-sm font-medium text-textSecondary mb-3">Select Algorithm</label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-card border border-primary/20 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-card/80 transition-all relative z-10"
            >
              <div className="flex items-center gap-3">
                {selectedAlgo && <selectedAlgo.icon className="w-5 h-5" style={{ color: selectedAlgo.color }} />}
                <span className="font-medium text-text">{selectedAlgo?.name}</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform text-textSecondary ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-[100] w-full mt-2 bg-card border border-primary/20 rounded-lg shadow-2xl overflow-hidden">
                {algorithms.map((algo) => (
                  <button
                    key={algo.id}
                    onClick={() => {
                      setSelectedAlgorithm(algo.id);
                      setIsDropdownOpen(false);
                      reset();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-card/80 transition-colors text-left border-b border-primary/20 last:border-b-0 text-text"
                  >
                    <algo.icon className="w-5 h-5" style={{ color: algo.color }} />
                    <span>{algo.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
          <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
            <label className="block text-sm font-medium text-textSecondary mb-2">Data Size: {dataSize}</label>
            <input
              type="range"
              min="20"
              max="100"
              value={dataSize}
              onChange={(e) => setDataSize(parseInt(e.target.value))}
              className="w-full h-2 bg-card rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
            <label className="block text-sm font-medium text-textSecondary mb-2">Noise Level: {noiseLevel}</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-card rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center gap-2 bg-primary px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
          >
            <Play className="w-5 h-5" />
            Run Model
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-card px-6 py-3 rounded-lg font-medium hover:bg-card/80 transition-all shadow-lg text-text"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="bg-card/50 backdrop-blur rounded-xl p-6 mb-6 border border-primary/20">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-text">Training Progress</span>
              <span className="text-sm font-medium text-text">{progress}%</span>
            </div>
            <div className="w-full bg-card rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {(progress > 0 || metrics.accuracy > 0 || metrics.mse > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isClassification ? (
              <>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur rounded-xl p-6 border border-green-500/30">
                  <div className="text-sm text-green-300 mb-1">Accuracy</div>
                  <div className="text-3xl font-bold text-green-400">{metrics.accuracy}%</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur rounded-xl p-6 border border-blue-500/30">
                  <div className="text-sm text-blue-300 mb-1">Precision</div>
                  <div className="text-3xl font-bold text-blue-400">{metrics.precision}%</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur rounded-xl p-6 border border-purple-500/30">
                  <div className="text-sm text-purple-300 mb-1">Recall</div>
                  <div className="text-3xl font-bold text-purple-400">{metrics.recall}%</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur rounded-xl p-6 border border-orange-500/30">
                  <div className="text-sm text-orange-300 mb-1">F1 Score</div>
                  <div className="text-3xl font-bold text-orange-400">{metrics.f1Score}%</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur rounded-xl p-6 border border-blue-500/30">
                  <div className="text-sm text-blue-300 mb-1">Mean Squared Error</div>
                  <div className="text-3xl font-bold text-blue-400">{metrics.mse}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur rounded-xl p-6 border border-green-500/30">
                  <div className="text-sm text-green-300 mb-1">R² Score</div>
                  <div className="text-3xl font-bold text-green-400">{metrics.r2Score}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Visualization Area */}
        {trainingData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Chart */}
            <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
              <h3 className="text-xl font-semibold mb-4 text-text">
                {isClassification ? 'Classification Results' : 'Regression Results'}
              </h3>
              {isClassification ? (
                <ScatterChart width={500} height={300} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="x" stroke="#94a3b8" />
                  <YAxis dataKey="y" stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #ff6b35', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Scatter data={trainingData} fill={selectedAlgo?.color}>
                    {trainingData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.class === 1 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              ) : (
                <LineChart width={500} height={300} data={trainingData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="x" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #ff6b35', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="y" stroke="#8b5cf6" name="Actual" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="Predicted" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              )}
            </div>

            {/* Confusion Matrix or Additional Metrics */}
            {isClassification && (
              <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                <h3 className="text-xl font-semibold mb-4 text-text">Confusion Matrix</h3>
                <div className="mb-4 text-sm text-textSecondary">
                  Click values to edit and see metrics update in real-time
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-xs text-textSecondary mb-2">Predicted Positive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-textSecondary mb-2">Predicted Negative</div>
                  </div>
                  
                  <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="text-xs text-green-300 mb-2">True Positive</div>
                    <input
                      type="number"
                      value={editableMatrix.tp}
                      onChange={(e) => handleMatrixChange('tp', e.target.value)}
                      className="text-3xl font-bold text-green-400 bg-transparent text-center w-20 border-b-2 border-green-400/30 focus:border-green-400 outline-none"
                      min="0"
                    />
                  </div>
                  
                  <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="text-xs text-red-300 mb-2">False Negative</div>
                    <input
                      type="number"
                      value={editableMatrix.fn}
                      onChange={(e) => handleMatrixChange('fn', e.target.value)}
                      className="text-3xl font-bold text-red-400 bg-transparent text-center w-20 border-b-2 border-red-400/30 focus:border-red-400 outline-none"
                      min="0"
                    />
                  </div>
                  
                  <div className="bg-orange-500/20 border-2 border-orange-500 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="text-xs text-orange-300 mb-2">False Positive</div>
                    <input
                      type="number"
                      value={editableMatrix.fp}
                      onChange={(e) => handleMatrixChange('fp', e.target.value)}
                      className="text-3xl font-bold text-orange-400 bg-transparent text-center w-20 border-b-2 border-orange-400/30 focus:border-orange-400 outline-none"
                      min="0"
                    />
                  </div>
                  
                  <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="text-xs text-blue-300 mb-2">True Negative</div>
                    <input
                      type="number"
                      value={editableMatrix.tn}
                      onChange={(e) => handleMatrixChange('tn', e.target.value)}
                      className="text-3xl font-bold text-blue-400 bg-transparent text-center w-20 border-b-2 border-blue-400/30 focus:border-blue-400 outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-textSecondary">
                  Total Predictions: {editableMatrix.tp + editableMatrix.fp + editableMatrix.tn + editableMatrix.fn}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Algorithm Info */}
        <div className="mt-6 bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
          <h3 className="text-xl font-semibold mb-3 text-text">About {selectedAlgo?.name}</h3>
          <p className="text-textSecondary leading-relaxed">
            {selectedAlgorithm === 'linear-regression' && 
              'Linear Regression models the relationship between variables by fitting a linear equation to observed data. It predicts continuous values by finding the best-fit line through the data points.'}
            {selectedAlgorithm === 'logistic-regression' && 
              'Logistic Regression is used for binary classification problems. It predicts the probability of an instance belonging to a particular class using the logistic function.'}
            {selectedAlgorithm === 'decision-tree' && 
              'Decision Trees make predictions by learning simple decision rules from data features. They split the data into subsets based on feature values, creating a tree-like structure.'}
            {selectedAlgorithm === 'knn' && 
              'K-Nearest Neighbors classifies new data points based on the majority class of their k nearest neighbors in the feature space. It\'s a simple yet effective non-parametric algorithm.'}
            {selectedAlgorithm === 'svm' && 
              'Support Vector Machines find the optimal hyperplane that maximally separates different classes. It\'s effective in high-dimensional spaces and versatile through kernel functions.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MLSimulator;

