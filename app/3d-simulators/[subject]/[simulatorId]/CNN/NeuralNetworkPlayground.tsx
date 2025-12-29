/**
 * Neural Network Playground - Interactive Deep Learning Simulator
 * 
 * A self-contained React component for training and visualizing neural networks
 * entirely in the browser using TensorFlow.js.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  X,
  Brain,
  Settings,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Scatter } from 'react-chartjs-2';
import type { NeuralNetworkPlaygroundProps, DataPoint, ModelConfig, TrainingMetrics, DatasetType, ActivationFunction, OptimizerType } from './types';
import { generateDataset, normalizeData } from './utils/datasetGenerator';
import { parseFile, type ParseFileResult, hasError } from './utils/fileParser';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default configuration
const DEFAULT_CONFIG: ModelConfig = {
  hiddenLayers: 1,
  layers: [{ neurons: 8, activation: 'relu' }],
  learningRate: 0.01,
  optimizer: 'adam',
  batchSize: 32,
  epochs: 50,
  shuffle: true,
  validationSplit: 0.2
};

/**
 * Main Neural Network Playground Component
 */
const NeuralNetworkPlayground: React.FC<NeuralNetworkPlaygroundProps> = ({ className = '', initialConfig }) => {
  // State management
  const [tfLoaded, setTfLoaded] = useState(false);
  const [tf, setTf] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [dataset, setDataset] = useState<DataPoint[]>([]);
  const [datasetType, setDatasetType] = useState<DatasetType>('linear');
  const [config, setConfig] = useState<ModelConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [trainingState, setTrainingState] = useState({
    isTraining: false,
    isPaused: false,
    currentEpoch: 0,
    metrics: [] as TrainingMetrics[],
    history: [] as TrainingMetrics[][]
  });
  const [showHelp, setShowHelp] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showDecisionBoundary, setShowDecisionBoundary] = useState(true);
  const [showWeights, setShowWeights] = useState(false);
  const [currentEpochSlider, setCurrentEpochSlider] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; prediction?: number } | null>(null);

  // Refs
  const trainingAbortRef = useRef<AbortController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const normalizedDataRef = useRef<{ data: DataPoint[]; minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  // Lazy load TensorFlow.js
  useEffect(() => {
    const loadTensorFlow = async () => {
      try {
        // Dynamic import of TensorFlow.js
        const tfModule = await import('@tensorflow/tfjs');
        // Handle both default export and named exports
        const tf = tfModule.default || tfModule;
        setTf(tf);
        setTfLoaded(true);
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        setError(`Failed to load TensorFlow.js: ${errorMsg}. Please restart your dev server.`);
        console.error('TensorFlow.js loading error:', err);
      }
    };
    loadTensorFlow();
  }, []);

  // Initialize dataset on mount and when type changes
  useEffect(() => {
    if (datasetType !== 'custom') {
      const newData = generateDataset(datasetType, 200);
      setDataset(newData);
      normalizedDataRef.current = normalizeData(newData);
    }
  }, [datasetType]);

  // Normalize dataset when it changes
  useEffect(() => {
    if (dataset.length > 0) {
      normalizedDataRef.current = normalizeData(dataset);
    }
  }, [dataset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (model) {
        model.dispose();
      }
      if (trainingAbortRef.current) {
        trainingAbortRef.current.abort();
      }
    };
  }, [model]);

  /**
   * Creates a TensorFlow.js model based on current configuration
   */
  const createModel = useCallback((): any => {
    if (!tfLoaded || !tf) {
      throw new Error('TensorFlow.js not loaded');
    }

    const newModel = tf.sequential();

    // Input layer (2D input: x, y)
    newModel.add(tf.layers.dense({
      inputShape: [2],
      units: config.layers[0]?.neurons || 8,
      activation: getActivationFunction(config.layers[0]?.activation || 'relu')
    }));

    // Hidden layers
    for (let i = 1; i < config.hiddenLayers; i++) {
      newModel.add(tf.layers.dense({
        units: config.layers[i]?.neurons || 8,
        activation: getActivationFunction(config.layers[i]?.activation || 'relu')
      }));
    }

    // Output layer (binary classification)
    newModel.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    // Compile model
    const optimizer = getOptimizer(config.optimizer, config.learningRate);
    newModel.compile({
      optimizer,
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return newModel;
  }, [config, tfLoaded, tf]);

  /**
   * Converts activation function string to TensorFlow function
   */
  const getActivationFunction = (activation: ActivationFunction): string => {
    switch (activation) {
      case 'relu':
        return 'relu';
      case 'sigmoid':
        return 'sigmoid';
      case 'tanh':
        return 'tanh';
      case 'leakyRelu':
        return 'leakyReLU';
      default:
        return 'relu';
    }
  };

  /**
   * Creates optimizer based on type
   */
  const getOptimizer = (optimizerType: OptimizerType, learningRate: number): any => {
    if (!tf) return null;
    switch (optimizerType) {
      case 'sgd':
        return tf.train.sgd(learningRate);
      case 'adam':
        return tf.train.adam(learningRate);
      case 'rmsprop':
        return tf.train.rmsprop(learningRate);
      default:
        return tf.train.adam(learningRate);
    }
  };

  /**
   * Initializes the model
   */
  const handleInitializeModel = useCallback(() => {
    try {
      if (model) {
        model.dispose();
      }
      const newModel = createModel();
      setModel(newModel);
      setTrainingState({
        isTraining: false,
        isPaused: false,
        currentEpoch: 0,
        metrics: [],
        history: []
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize model');
    }
  }, [createModel, model]);

  /**
   * Handles file upload for custom dataset
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const result = await parseFile(file);
    
    if (hasError(result)) {
      setError(result.error.message);
      return;
    }

    if (!result.data || result.data.length === 0) {
      setError('No valid data points found in file');
      return;
    }

    setDataset(result.data);
    setDatasetType('custom');
    event.target.value = ''; // Reset input
  };

  /**
   * Trains the model
   */
  const handleTrain = async () => {
    if (!model || !tfLoaded || normalizedDataRef.current === null) {
      setError('Model not initialized or data not available');
      return;
    }

    if (trainingState.isTraining) {
      return;
    }

    const normalized = normalizedDataRef.current.data;
    if (normalized.length === 0) {
      setError('No data available for training');
      return;
    }

    if (!tf) {
      setError('TensorFlow.js not loaded');
      return;
    }

    // Prepare data
    const xs = normalized.map(d => [d.x, d.y]);
    const ys = normalized.map(d => d.label);
    
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor1d(ys);

    // Split data if validation split is enabled
    const splitIndex = Math.floor(normalized.length * (1 - config.validationSplit));
    const trainXs = xsTensor.slice([0, 0], [splitIndex, 2]);
    const trainYs = ysTensor.slice([0], [splitIndex]);
    const valXs = xsTensor.slice([splitIndex, 0], [-1, 2]);
    const valYs = ysTensor.slice([splitIndex], [-1]);

    setTrainingState(prev => ({
      ...prev,
      isTraining: true,
      isPaused: false,
      currentEpoch: 0,
      metrics: []
    }));

    trainingAbortRef.current = new AbortController();

    try {
      await model.fit(trainXs, trainYs, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        shuffle: config.shuffle,
        validationData: config.validationSplit > 0 ? [valXs, valYs] : undefined,
        callbacks: {
          onEpochEnd: async (epoch: number, logs: any) => {
            if (trainingAbortRef.current?.signal.aborted) {
              return;
            }

            const metrics: TrainingMetrics = {
              epoch: epoch + 1,
              loss: logs?.loss as number || 0,
              accuracy: logs?.acc as number || 0,
              valLoss: logs?.val_loss as number,
              valAccuracy: logs?.val_acc as number
            };

            setTrainingState(prev => ({
              ...prev,
              currentEpoch: epoch + 1,
              metrics: [...prev.metrics, metrics]
            }));

            // Update decision boundary periodically
            if ((epoch + 1) % 5 === 0 || epoch === 0) {
              if (tf && tf.nextFrame) {
                await tf.nextFrame();
              }
              drawDecisionBoundary();
            }

            if (tf && tf.nextFrame) {
              await tf.nextFrame(); // Prevent UI blocking
            }
          }
        }
      });

      // Final decision boundary update
      drawDecisionBoundary();

      setTrainingState(prev => ({
        ...prev,
        isTraining: false,
        history: [...prev.history, prev.metrics]
      }));

      // Cleanup tensors
      xsTensor.dispose();
      ysTensor.dispose();
      trainXs.dispose();
      trainYs.dispose();
      if (config.validationSplit > 0) {
        valXs.dispose();
        valYs.dispose();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Training failed');
      }
      setTrainingState(prev => ({
        ...prev,
        isTraining: false
      }));
    }
  };

  /**
   * Pauses training
   */
  const handlePause = () => {
    if (trainingAbortRef.current) {
      trainingAbortRef.current.abort();
    }
    setTrainingState(prev => ({
      ...prev,
      isPaused: true,
      isTraining: false
    }));
  };

  /**
   * Resets the model and training state
   */
  const handleReset = () => {
    if (model) {
      model.dispose();
    }
    setModel(null);
    setTrainingState({
      isTraining: false,
      isPaused: false,
      currentEpoch: 0,
      metrics: [],
      history: []
    });
    setCurrentEpochSlider(0);
    setError(null);
  };

  /**
   * Downloads the model
   */
  const handleDownloadModel = async () => {
    if (!model) {
      setError('No model to download');
      return;
    }

    try {
      await model.save('downloads://neural-network-model');
    } catch (err: any) {
      setError(err.message || 'Failed to download model');
    }
  };

  /**
   * Draws the decision boundary on canvas
   */
  const drawDecisionBoundary = useCallback(async () => {
    if (!model || !canvasRef.current || !normalizedDataRef.current || !showDecisionBoundary) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const resolution = 50; // Grid resolution for performance

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw decision boundary
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;

    for (let py = 0; py < height; py += resolution) {
      for (let px = 0; px < width; px += resolution) {
        const x = (px / width) * 2 - 1;
        const y = 1 - (py / height) * 2;

        if (!tf) return;
        try {
          const prediction = model.predict(tf.tensor2d([[x, y]]));
          const prob = await prediction.data();
          prediction.dispose();

          const probability = prob[0];
          const alpha = Math.abs(probability - 0.5) * 2; // Higher contrast near boundary

          // Color based on prediction
          const r = probability > 0.5 ? 255 : 0;
          const g = probability > 0.5 ? 0 : 255;
          const b = 0;
          const a = Math.min(alpha * 100, 100);

          // Fill grid cell
          for (let dy = 0; dy < resolution && py + dy < height; dy++) {
            for (let dx = 0; dx < resolution && px + dx < width; dx++) {
              const idx = ((py + dy) * width + (px + dx)) * 4;
              pixels[idx] = r;
              pixels[idx + 1] = g;
              pixels[idx + 2] = b;
              pixels[idx + 3] = a;
            }
          }
        } catch (err) {
          console.error('Error drawing decision boundary:', err);
        }
      }
      if (tf && tf.nextFrame) {
        await tf.nextFrame(); // Prevent blocking
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw data points
    const normalized = normalizedDataRef.current.data;
    normalized.forEach(point => {
      const px = ((point.x + 1) / 2) * width;
      const py = ((1 - point.y) / 2) * height;

      ctx.fillStyle = point.label === 1 ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw hover point if exists
    if (hoverPoint) {
      const px = ((hoverPoint.x + 1) / 2) * width;
      const py = ((1 - hoverPoint.y) / 2) * height;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [model, showDecisionBoundary, hoverPoint]);

  // Update canvas when model or data changes
  useEffect(() => {
    if (model && normalizedDataRef.current) {
      drawDecisionBoundary();
    }
  }, [model, dataset, showDecisionBoundary, drawDecisionBoundary]);

  /**
   * Handles canvas click for prediction
   */
  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!model || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;

        if (!tf) return;
        try {
          const prediction = model.predict(tf.tensor2d([[x, y]]));
          const prob = await prediction.data();
          prediction.dispose();

      setHoverPoint({ x, y, prediction: prob[0] });
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };

  // Chart data for training metrics
  const chartData = useMemo(() => {
    const labels = trainingState.metrics.map(m => m.epoch);
    return {
      labels,
      datasets: [
        {
          label: 'Loss',
          data: trainingState.metrics.map(m => m.loss),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Accuracy',
          data: trainingState.metrics.map(m => m.accuracy),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          yAxisID: 'y1'
        },
        ...(config.validationSplit > 0 ? [
          {
            label: 'Val Loss',
            data: trainingState.metrics.map(m => m.valLoss || 0),
            borderColor: 'rgb(251, 191, 36)',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Val Accuracy',
            data: trainingState.metrics.map(m => m.valAccuracy || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            yAxisID: 'y1'
          }
        ] : [])
      ]
    };
  }, [trainingState.metrics, config.validationSplit]);

  return (
    <div className={`neural-network-playground bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-primary" size={24} />
          <div>
            <h2 className="text-xl font-bold">Neural Network Playground</h2>
            <p className="text-sm text-gray-400">Interactive deep learning simulator for binary classification</p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Show help"
        >
          <HelpCircle size={20} className="text-primary" />
        </button>
      </div>

      {!tfLoaded && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading TensorFlow.js...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 m-4 rounded-lg">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-sm underline">
            Dismiss
          </button>
        </div>
      )}

      {tfLoaded && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)]">
          {/* Left Control Panel */}
          <motion.div
            initial={false}
            animate={{ width: showControls ? '320px' : '0px' }}
            className="bg-gray-800 border-r border-gray-700 overflow-hidden"
          >
            {showControls && (
              <div className="w-80 p-4 overflow-y-auto h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings size={20} />
                    Controls
                  </h3>
                  <button
                    onClick={() => setShowControls(false)}
                    className="p-1 hover:bg-gray-700 rounded"
                    aria-label="Collapse controls"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Dataset Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Dataset</label>
                  <select
                    value={datasetType}
                    onChange={(e) => {
                      setDatasetType(e.target.value as DatasetType);
                      handleReset();
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                    disabled={trainingState.isTraining}
                  >
                    <option value="linear">Linear</option>
                    <option value="circles">Circles</option>
                    <option value="moons">Moons</option>
                    <option value="spiral">Spiral</option>
                    <option value="custom">Custom (Upload)</option>
                  </select>
                  {datasetType === 'custom' && (
                    <div className="mt-2">
                      <label className="block text-sm mb-2">Upload CSV or Excel</label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                        disabled={trainingState.isTraining}
                      />
                    </div>
                  )}
                </div>

                {/* Model Architecture */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Hidden Layers: {config.hiddenLayers}</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={config.hiddenLayers}
                    onChange={(e) => {
                      const layers = parseInt(e.target.value);
                      const newLayers = Array(layers).fill(null).map((_, i) => 
                        config.layers[i] || { neurons: 8, activation: 'relu' }
                      );
                      setConfig({ ...config, hiddenLayers: layers, layers: newLayers });
                    }}
                    className="w-full"
                    disabled={trainingState.isTraining || !!model}
                  />
                  
                  {config.layers.map((layer, idx) => (
                    <div key={idx} className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <label className="block text-sm font-medium mb-2">Layer {idx + 1}</label>
                      <div className="mb-2">
                        <label className="block text-xs text-gray-400 mb-1">Neurons: {layer.neurons}</label>
                        <input
                          type="range"
                          min="2"
                          max="64"
                          value={layer.neurons}
                          onChange={(e) => {
                            const newLayers = [...config.layers];
                            newLayers[idx].neurons = parseInt(e.target.value);
                            setConfig({ ...config, layers: newLayers });
                          }}
                          className="w-full"
                          disabled={trainingState.isTraining || !!model}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Activation</label>
                        <select
                          value={layer.activation}
                          onChange={(e) => {
                            const newLayers = [...config.layers];
                            newLayers[idx].activation = e.target.value as ActivationFunction;
                            setConfig({ ...config, layers: newLayers });
                          }}
                          className="w-full bg-gray-600 border border-gray-500 rounded p-1 text-sm text-white"
                          disabled={trainingState.isTraining || !!model}
                        >
                          <option value="relu">ReLU</option>
                          <option value="sigmoid">Sigmoid</option>
                          <option value="tanh">Tanh</option>
                          <option value="leakyRelu">LeakyReLU</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Training Hyperparameters */}
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Learning Rate: {config.learningRate.toFixed(4)}
                    </label>
                    <input
                      type="range"
                      min="0.0001"
                      max="0.1"
                      step="0.0001"
                      value={config.learningRate}
                      onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                      className="w-full"
                      disabled={trainingState.isTraining || !!model}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Optimizer</label>
                    <select
                      value={config.optimizer}
                      onChange={(e) => setConfig({ ...config, optimizer: e.target.value as OptimizerType })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                      disabled={trainingState.isTraining || !!model}
                    >
                      <option value="sgd">SGD</option>
                      <option value="adam">Adam</option>
                      <option value="rmsprop">RMSprop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Batch Size: {config.batchSize}</label>
                    <input
                      type="range"
                      min="8"
                      max="128"
                      step="8"
                      value={config.batchSize}
                      onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
                      className="w-full"
                      disabled={trainingState.isTraining || !!model}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Epochs: {config.epochs}</label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={config.epochs}
                      onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                      className="w-full"
                      disabled={trainingState.isTraining || !!model}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shuffle"
                      checked={config.shuffle}
                      onChange={(e) => setConfig({ ...config, shuffle: e.target.checked })}
                      className="rounded"
                      disabled={trainingState.isTraining || !!model}
                    />
                    <label htmlFor="shuffle" className="text-sm">Shuffle dataset</label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleInitializeModel}
                    disabled={trainingState.isTraining}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Initialize Model
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTrain}
                      disabled={!model || trainingState.isTraining}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      Train
                    </button>
                    <button
                      onClick={handlePause}
                      disabled={!trainingState.isTraining}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Pause size={16} />
                      Pause
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      disabled={trainingState.isTraining}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Reset
                    </button>
                    <button
                      onClick={handleDownloadModel}
                      disabled={!model}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!showControls && (
              <button
                onClick={() => setShowControls(true)}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-700 hover:bg-gray-600 rounded-r-lg"
                aria-label="Expand controls"
              >
                <ChevronUp size={20} className="rotate-90" />
              </button>
            )}
          </motion.div>

          {/* Center Visualization */}
          <div className="flex-1 flex flex-col bg-gray-900">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Visualization</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDecisionBoundary(!showDecisionBoundary)}
                    className={`p-2 rounded-lg transition-colors ${showDecisionBoundary ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-400'}`}
                    aria-label="Toggle decision boundary"
                  >
                    {showDecisionBoundary ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
              {trainingState.isTraining && (
                <div className="text-sm text-gray-400">
                  Epoch: {trainingState.currentEpoch} / {config.epochs}
                </div>
              )}
            </div>
            <div className="flex-1 p-4 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                onClick={handleCanvasClick}
                onMouseMove={(e) => {
                  if (!canvasRef.current) return;
                  const rect = canvasRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                  const y = 1 - ((e.clientY - rect.top) / rect.height) * 2;
                  setHoverPoint({ x, y });
                }}
                className="border border-gray-700 rounded-lg cursor-crosshair bg-white"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            {hoverPoint && hoverPoint.prediction !== undefined && (
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <p className="text-sm">
                  Point: ({hoverPoint.x.toFixed(3)}, {hoverPoint.y.toFixed(3)}) | 
                  Prediction: {(hoverPoint.prediction * 100).toFixed(1)}% (Class {hoverPoint.prediction > 0.5 ? 1 : 0})
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Charts */}
          <div className="w-96 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BarChart3 size={20} />
                Training Metrics
              </h3>
              {trainingState.metrics.length > 0 ? (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, labels: { color: '#fff' } },
                      tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                      x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
                      y: { 
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: '#9ca3af' },
                        grid: { color: '#374151' }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: '#9ca3af' },
                        grid: { drawOnChartArea: false }
                      }
                    }
                  }}
                  height={300}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  No training data yet. Initialize model and start training.
                </div>
              )}
            </div>

            {trainingState.metrics.length > 0 && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400">Current Epoch: <span className="text-white font-semibold">{trainingState.currentEpoch}</span></p>
                  <p className="text-gray-400">Loss: <span className="text-white font-semibold">{trainingState.metrics[trainingState.metrics.length - 1]?.loss.toFixed(4)}</span></p>
                  <p className="text-gray-400">Accuracy: <span className="text-white font-semibold">{(trainingState.metrics[trainingState.metrics.length - 1]?.accuracy * 100).toFixed(2)}%</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Neural Network Playground - Help</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                  aria-label="Close help"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Getting Started</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Select a dataset type or upload your own CSV/Excel file</li>
                    <li>Configure the model architecture (layers, neurons, activation functions)</li>
                    <li>Set training hyperparameters (learning rate, optimizer, batch size, epochs)</li>
                    <li>Click "Initialize Model" to create the neural network</li>
                    <li>Click "Train" to start training</li>
                  </ol>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Features</h4>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Real-time visualization:</strong> Watch the decision boundary update as the model trains</li>
                    <li><strong>Interactive predictions:</strong> Click anywhere on the canvas to see model predictions</li>
                    <li><strong>Training metrics:</strong> Monitor loss and accuracy in real-time</li>
                    <li><strong>Custom datasets:</strong> Upload your own CSV or Excel files with x, y, and label columns</li>
                    <li><strong>Model download:</strong> Save trained models for later use</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Tips</h4>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Start with simpler architectures (1-2 layers) to understand the basics</li>
                    <li>Adjust learning rate if training is too slow (increase) or unstable (decrease)</li>
                    <li>Use Adam optimizer for better convergence in most cases</li>
                    <li>Enable validation split to monitor overfitting</li>
                    <li>Try different activation functions to see their effects on the decision boundary</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeuralNetworkPlayground;

