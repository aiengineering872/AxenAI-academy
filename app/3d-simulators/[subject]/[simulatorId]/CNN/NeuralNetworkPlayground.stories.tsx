/**
 * Storybook story for Neural Network Playground
 */

import type { Meta, StoryObj } from '@storybook/react';
import NeuralNetworkPlayground from './NeuralNetworkPlayground';

const meta: Meta<typeof NeuralNetworkPlayground> = {
  title: 'Components/NeuralNetworkPlayground',
  component: NeuralNetworkPlayground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An interactive neural network playground for training and visualizing binary classification models in the browser using TensorFlow.js.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof NeuralNetworkPlayground>;

export const Default: Story = {
  args: {
    className: ''
  }
};

export const WithInitialConfig: Story = {
  args: {
    className: '',
    initialConfig: {
      hiddenLayers: 2,
      layers: [
        { neurons: 16, activation: 'relu' },
        { neurons: 8, activation: 'relu' }
      ],
      learningRate: 0.01,
      optimizer: 'adam',
      batchSize: 32,
      epochs: 100,
      shuffle: true,
      validationSplit: 0.2
    }
  }
};

