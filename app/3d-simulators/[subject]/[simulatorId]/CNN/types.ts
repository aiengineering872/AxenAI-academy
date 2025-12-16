/**
 * Type definitions for Neural Network Playground
 */

export type DatasetType = 'linear' | 'circles' | 'moons' | 'spiral' | 'custom';

export type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'leakyRelu';

export type OptimizerType = 'sgd' | 'adam' | 'rmsprop';

export interface DataPoint {
  x: number;
  y: number;
  label: number;
}

export interface LayerConfig {
  neurons: number;
  activation: ActivationFunction;
}

export interface ModelConfig {
  hiddenLayers: number;
  layers: LayerConfig[];
  learningRate: number;
  optimizer: OptimizerType;
  batchSize: number;
  epochs: number;
  shuffle: boolean;
  validationSplit: number;
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
}

export interface TrainingState {
  isTraining: boolean;
  isPaused: boolean;
  currentEpoch: number;
  metrics: TrainingMetrics[];
  history: TrainingMetrics[][];
}

export interface NeuralNetworkPlaygroundProps {
  className?: string;
  initialConfig?: Partial<ModelConfig>;
}

