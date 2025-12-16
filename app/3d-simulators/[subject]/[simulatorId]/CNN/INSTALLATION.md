# Neural Network Playground - Installation Guide

## Quick Start

### 1. Install Dependencies

Run the following command to install all required packages:

```bash
npm install @tensorflow/tfjs react-chartjs-2 chart.js papaparse xlsx framer-motion lucide-react
```

If you haven't already, install TypeScript:

```bash
npm install --save-dev typescript @types/react @types/react-dom
```

### 2. Verify Installation

The component is already integrated into your project. To use it:

1. Navigate to a topic with `topic_id` of `deep-learning` or `deep learning`
2. The Neural Network Playground simulator will appear in the Simulators section
3. Click on it to launch the interactive playground

### 3. Manual Import (Optional)

If you want to use the component elsewhere in your app:

```tsx
import NeuralNetworkPlayground from './components/NeuralNetworkPlayground';

function MyComponent() {
  return (
    <div className="h-screen">
      <NeuralNetworkPlayground />
    </div>
  );
}
```

## File Structure

```
src/components/NeuralNetworkPlayground/
├── NeuralNetworkPlayground.tsx    # Main component (1042 lines)
├── types.ts                        # TypeScript definitions
├── index.ts                        # Export file
├── utils/
│   ├── datasetGenerator.ts        # Dataset generation (linear, circles, moons, spiral)
│   └── fileParser.ts              # CSV/Excel parsing with validation
├── __tests__/
│   ├── datasetGenerator.test.ts   # Unit tests for datasets
│   └── fileParser.test.ts         # Unit tests for file parsing
├── NeuralNetworkPlayground.stories.tsx  # Storybook story
├── README.md                       # Comprehensive documentation
└── INSTALLATION.md                 # This file
```

## Features Implemented

✅ All core requirements:
- Dataset selector (Linear, Circles, Moons, Spiral, Custom CSV/Excel)
- Model architecture controls (0-5 hidden layers, neurons, activations)
- Training hyperparameters (learning rate, optimizer, batch size, epochs)
- Real-time decision boundary visualization
- Interactive predictions (click on canvas)
- Training metrics charts (loss, accuracy)
- Model download functionality
- Help modal with usage tips
- Responsive design (desktop, tablet, mobile)
- Keyboard accessible controls
- Lazy-loaded TensorFlow.js
- Client-side CSV/Excel parsing with error handling

✅ Code Quality:
- TypeScript with strict types
- Well-commented code
- Production-ready error handling
- Memory leak prevention (tensor disposal)
- Performance optimizations (async updates, resolution control)

✅ Testing & Documentation:
- Unit tests for core utilities
- Storybook story
- Comprehensive README
- Installation guide

## Integration Status

The component is already integrated into `TopicDetail.jsx`:
- Automatically shows for topics with `topic_id` = `deep-learning`
- Can be triggered by simulator name containing "neural", "network", or "deep learning"
- Full-screen display with back button

## Next Steps

1. **Install dependencies**: Run `npm install` to get all required packages
2. **Test the component**: Navigate to a deep learning topic and click the simulator
3. **Customize** (optional): Modify `initialConfig` prop for default settings

## Troubleshooting

### TensorFlow.js not loading
- Check browser console for errors
- Ensure stable internet connection (first load downloads TF.js)
- Try clearing browser cache

### TypeScript errors
- Ensure TypeScript is installed: `npm install --save-dev typescript`
- Check `tsconfig.json` is properly configured

### Component not appearing
- Verify topic has `topic_id` = `deep-learning` or contains "deep learning" in name
- Check browser console for import errors
- Ensure all dependencies are installed

## Support

For detailed usage instructions, see `README.md` in the component directory.

