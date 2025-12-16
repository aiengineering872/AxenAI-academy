# Neural Network Playground

A self-contained, interactive React component for training and visualizing neural networks entirely in the browser using TensorFlow.js. Perfect for data science students who want to practice deep learning concepts without backend infrastructure.

## Features

- **Interactive Training**: Train neural networks in real-time with visual feedback
- **Multiple Datasets**: Pre-built datasets (Linear, Circles, Moons, Spiral) or upload your own CSV/Excel files
- **Customizable Architecture**: Configure hidden layers, neurons per layer, and activation functions
- **Real-time Visualization**: Watch decision boundaries update as the model trains
- **Training Metrics**: Monitor loss and accuracy with interactive charts
- **Model Download**: Save trained models for later use
- **No Backend Required**: Everything runs client-side using TensorFlow.js

## Installation

### Required Packages

Install the following npm packages:

```bash
npm install @tensorflow/tfjs react-chartjs-2 chart.js papaparse xlsx framer-motion lucide-react
```

### TypeScript Support

If using TypeScript, ensure you have TypeScript installed:

```bash
npm install --save-dev typescript @types/react @types/react-dom
```

## Usage

### Basic Import

```tsx
import NeuralNetworkPlayground from './components/NeuralNetworkPlayground';

function App() {
  return (
    <div className="h-screen">
      <NeuralNetworkPlayground />
    </div>
  );
}
```

### With Custom Configuration

```tsx
import NeuralNetworkPlayground from './components/NeuralNetworkPlayground';

function App() {
  const initialConfig = {
    hiddenLayers: 2,
    layers: [
      { neurons: 16, activation: 'relu' },
      { neurons: 8, activation: 'tanh' }
    ],
    learningRate: 0.01,
    optimizer: 'adam',
    batchSize: 32,
    epochs: 100
  };

  return (
    <div className="h-screen">
      <NeuralNetworkPlayground initialConfig={initialConfig} />
    </div>
  );
}
```

### Lazy Loading (Recommended)

For better performance, lazy load the component:

```tsx
import { lazy, Suspense } from 'react';

const NeuralNetworkPlayground = lazy(() => import('./components/NeuralNetworkPlayground'));

function App() {
  return (
    <Suspense fallback={<div>Loading simulator...</div>}>
      <NeuralNetworkPlayground />
    </Suspense>
  );
}
```

## Component API

### Props

```typescript
interface NeuralNetworkPlaygroundProps {
  className?: string;           // Additional CSS classes
  initialConfig?: Partial<ModelConfig>;  // Initial model configuration
}
```

### ModelConfig Interface

```typescript
interface ModelConfig {
  hiddenLayers: number;          // Number of hidden layers (0-5)
  layers: LayerConfig[];          // Layer configurations
  learningRate: number;           // Learning rate (0.0001 - 0.1)
  optimizer: 'sgd' | 'adam' | 'rmsprop';  // Optimizer type
  batchSize: number;              // Batch size (8-128)
  epochs: number;                 // Number of training epochs (10-200)
  shuffle: boolean;               // Shuffle dataset
  validationSplit: number;        // Validation split ratio (0-0.5)
}
```

## Custom Dataset Format

When uploading CSV or Excel files, ensure they have the following columns:

- **x**: X-coordinate (numeric)
- **y**: Y-coordinate (numeric)
- **label**: Class label (0 or 1 for binary classification)

### CSV Example

```csv
x,y,label
-1.5,0.5,0
1.2,-0.8,1
0.3,1.1,0
```

### Excel Example

Same format as CSV. The parser automatically detects column names (case-insensitive) and accepts variations like:
- `x`, `X`, `X_COORD`
- `y`, `Y`, `Y_COORD`
- `label`, `Label`, `class`, `Class`, `target`, `Target`

## Architecture

```
src/components/NeuralNetworkPlayground/
├── NeuralNetworkPlayground.tsx    # Main component
├── types.ts                        # TypeScript type definitions
├── index.ts                        # Export file
├── utils/
│   ├── datasetGenerator.ts        # Dataset generation utilities
│   └── fileParser.ts              # CSV/Excel parsing utilities
├── __tests__/
│   ├── datasetGenerator.test.ts   # Unit tests for dataset generation
│   └── fileParser.test.ts         # Unit tests for file parsing
├── NeuralNetworkPlayground.stories.tsx  # Storybook story
└── README.md                       # This file
```

## Key Features Explained

### 1. Dataset Selection

Choose from pre-built datasets:
- **Linear**: Simple linearly separable data
- **Circles**: Concentric circles (non-linearly separable)
- **Moons**: Two interleaving half-circles
- **Spiral**: Spiral patterns
- **Custom**: Upload your own CSV or Excel file

### 2. Model Architecture

- Configure 0-5 hidden layers
- Set neurons per layer (2-64)
- Choose activation functions: ReLU, Sigmoid, Tanh, LeakyReLU

### 3. Training Controls

- **Learning Rate**: Controls step size during optimization
- **Optimizer**: SGD, Adam, or RMSprop
- **Batch Size**: Number of samples per gradient update
- **Epochs**: Number of complete passes through the dataset
- **Shuffle**: Randomize data order each epoch
- **Validation Split**: Reserve portion of data for validation

### 4. Visualization

- **Decision Boundary**: Real-time contour plot showing model predictions
- **Data Points**: Colored by class (blue = class 1, red = class 0)
- **Interactive Predictions**: Click anywhere on canvas to see model prediction
- **Training Metrics**: Real-time loss and accuracy charts

### 5. Model Management

- **Initialize Model**: Create new model with current configuration
- **Train**: Start training process
- **Pause**: Stop training (can resume)
- **Reset**: Clear model and training history
- **Download**: Save model as JSON + binary files

## Performance Considerations

- **Lazy Loading**: TensorFlow.js is dynamically imported to reduce initial bundle size
- **Async Updates**: Uses `tf.nextFrame()` to prevent UI blocking during training
- **Decision Boundary Resolution**: Automatically adjusts resolution for performance
- **Memory Management**: Properly disposes tensors to prevent memory leaks

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may have performance differences)
- Mobile: Supported but may have performance limitations

## Troubleshooting

### TensorFlow.js Not Loading

- Check browser console for errors
- Ensure you have a stable internet connection (first load downloads TensorFlow.js)
- Try clearing browser cache

### Training Too Slow

- Reduce batch size
- Reduce number of epochs
- Use simpler architecture (fewer layers/neurons)
- Disable decision boundary updates during training

### File Upload Errors

- Ensure CSV/Excel has x, y, and label columns
- Check that all values are numeric
- Verify file format (CSV or Excel)

### Memory Issues

- Reduce dataset size
- Use smaller batch sizes
- Reset model between training sessions

## Development

### Running Tests

```bash
npm test -- NeuralNetworkPlayground
```

### Storybook

```bash
npm run storybook
```

Then navigate to the Neural Network Playground story.

## Best Practices

1. **Start Simple**: Begin with 1-2 hidden layers and 8-16 neurons
2. **Monitor Metrics**: Watch for overfitting (validation loss increases while training loss decreases)
3. **Experiment**: Try different activation functions and optimizers
4. **Save Models**: Download successful models for later use
5. **Use Validation**: Enable validation split to monitor generalization

## Example Workflows

### Beginner Workflow

1. Select "Linear" dataset
2. Set 1 hidden layer with 8 neurons
3. Use ReLU activation
4. Set learning rate to 0.01
5. Use Adam optimizer
6. Set 50 epochs
7. Initialize and train

### Advanced Workflow

1. Upload custom dataset
2. Configure 3 hidden layers (16, 8, 4 neurons)
3. Use different activations per layer
4. Enable validation split (0.2)
5. Train with 100 epochs
6. Analyze decision boundary and metrics
7. Download model

## License

This component is part of the Data Science Academy application.

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

