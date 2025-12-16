"use client";

import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { 
  Upload, Image as ImageIcon, X, Trash2, Brain, Loader2, CheckCircle2, 
  Layers, User, Box, Download, ZoomIn, Grid3x3, Filter, Eye, 
  ChevronRight, Info, Maximize2, Minimize2, Play, Pause, RotateCcw
} from "lucide-react";

interface Prediction {
  className: string;
  probability: number;
}

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface FeatureMap {
  name: string;
  data: number[][][];
  width: number;
  height: number;
  channels: number;
}

interface KernelFilter {
  name: string;
  size: number;
  kernel: number[][];
  description: string;
  purpose: string;
}

const predefinedKernels: KernelFilter[] = [
  {
    name: "Vertical Edge",
    size: 3,
    kernel: [[1, 0, -1], [2, 0, -2], [1, 0, -1]],
    description: "Sobel vertical edge detector",
    purpose: "Detects vertical edges and boundaries"
  },
  {
    name: "Horizontal Edge",
    size: 3,
    kernel: [[1, 2, 1], [0, 0, 0], [-1, -2, -1]],
    description: "Sobel horizontal edge detector",
    purpose: "Detects horizontal edges and boundaries"
  },
  {
    name: "Sharpen",
    size: 3,
    kernel: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    description: "Sharpening filter",
    purpose: "Enhances edges and fine details"
  },
  {
    name: "Blur (Box)",
    size: 3,
    kernel: [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]],
    description: "Box blur filter",
    purpose: "Smooths image by averaging neighbors"
  },
  {
    name: "Emboss",
    size: 3,
    kernel: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
    description: "Embossing filter",
    purpose: "Creates 3D relief effect"
  },
  {
    name: "Edge Detection",
    size: 3,
    kernel: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
    description: "Laplacian edge detector",
    purpose: "Detects all edges in all directions"
  }
];

export default function CNNSimulator() {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [featureMaps, setFeatureMaps] = useState<FeatureMap[]>([]);
  const [selectedKernel, setSelectedKernel] = useState<KernelFilter>(predefinedKernels[0]);
  const [kernelOutput, setKernelOutput] = useState<ImageData | null>(null);
  const [activeTab, setActiveTab] = useState<'detection' | 'architecture' | 'features' | 'kernels'>('detection');
  const [selectedFeatureMap, setSelectedFeatureMap] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [layerOutputs, setLayerOutputs] = useState<ImageData[]>([]);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);

  const architectureLayers = [
    { name: 'Input Layer', desc: 'RGB Image (224×224×3)', color: 'blue', size: '224×224', type: 'input' as const },
    { name: 'Conv2D + ReLU', desc: '32 filters (3×3), stride 2', color: 'green', size: '112×112', type: 'conv' as const },
    { name: 'Depthwise Conv + ReLU', desc: '64 filters, bottleneck', color: 'green', size: '56×56', type: 'conv' as const },
    { name: 'Inverted Residual Blocks', desc: '17 blocks with skip connections', color: 'green', size: '28×28', type: 'conv' as const },
    { name: 'Conv2D 1×1', desc: '1280 filters', color: 'yellow', size: '14×14', type: 'conv' as const },
    { name: 'Global Average Pooling', desc: 'Reduces to 1×1×1280', color: 'orange', size: '7×7', type: 'pool' as const },
    { name: 'Dense (Fully Connected)', desc: '1000 units', color: 'red', size: '1×1000', type: 'dense' as const },
    { name: 'Softmax', desc: 'Output probabilities', color: 'purple', size: '1×1000', type: 'softmax' as const }
  ];
  const totalLayers = architectureLayers.length;

  const buildSoftmaxImage = (preds: Prediction[], size = 200) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0b1021';
    ctx.fillRect(0, 0, size, size);

    const bars = preds.slice(0, 5);
    const barWidth = size / Math.max(bars.length, 1);
    ctx.imageSmoothingEnabled = false;
    bars.forEach((p, i) => {
      const h = Math.max(6, p.probability * size * 0.9);
      const x = i * barWidth + barWidth * 0.2;
      const y = size - h - 10;
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#34d399');
      grad.addColorStop(1, '#10b981');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth * 0.6, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth * 0.6, h);
    });

    return ctx.getImageData(0, 0, size, size);
  };

  const buildDenseImage = (preds: Prediction[], size = 200) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0b1021';
    ctx.fillRect(0, 0, size, size);

    const bars = preds.slice(0, 5);
    const barWidth = size / Math.max(bars.length, 1);
    bars.forEach((p, i) => {
      const h = Math.max(8, p.probability * size * 0.8);
      const x = i * barWidth + barWidth * 0.15;
      const y = size - h - 12;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x, y, barWidth * 0.7, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth * 0.7, h);
    });

    return ctx.getImageData(0, 0, size, size);
  };
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const kernelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobilenetRef = useRef<mobilenet.MobileNet | null>(null);
  const cocoSsdRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadModel();
    
    // Cleanup on unmount
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  const loadModel = async () => {
    try {
      setIsLoadingModel(true);
      setError(null);
      console.log("Loading AI models...");
      
      const [mobilenetModel, cocoModel] = await Promise.all([
        mobilenet.load({ version: 2, alpha: 1.0 }),
        cocoSsd.load()
      ]);
      
      mobilenetRef.current = mobilenetModel;
      cocoSsdRef.current = cocoModel;
      setModelLoaded(true);
      setIsLoadingModel(false);
      console.log("AI models loaded successfully!");
    } catch (err) {
      console.error("Failed to load models:", err);
      setError("Failed to load AI models. Please refresh the page.");
      setIsLoadingModel(false);
    }
  };

  const loadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!modelLoaded) {
      setError("Please wait for the AI model to load first.");
      return;
    }

    clearImage();
    setError(null);
    setIsProcessing(true);

    const url = URL.createObjectURL(file);
    setImageURL(url);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      runCNN(img);
    };
    img.onerror = () => {
      setError("Failed to load image");
      setIsProcessing(false);
    };
    img.src = url;
  };

  const clearImage = () => {
    if (imageURL) {
      URL.revokeObjectURL(imageURL);
    }
    
    [canvasRef, kernelCanvasRef].forEach(ref => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, ref.current.width, ref.current.height);
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setImageURL(null);
    setError(null);
    setIsProcessing(false);
    setPredictions([]);
    setDetections([]);
    setFeatureMaps([]);
    setKernelOutput(null);
    setSelectedFeatureMap(null);
    imgRef.current = null;
  };

  const runCNN = async (img: HTMLImageElement) => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!mobilenetRef.current || !cocoSsdRef.current) {
        throw new Error("Models not loaded");
      }

      // Run both models in parallel
      const [predictions, detectionResults] = await Promise.all([
        mobilenetRef.current.classify(img, 10),
        cocoSsdRef.current.detect(img)
      ]);
      
      setPredictions(predictions.slice(0, 5));
      setDetections(detectionResults as Detection[]);

      // Draw image with detection boxes
      drawImageWithDetections(img, detectionResults);

      // Extract feature maps
      await extractFeatureMaps(img);

      // Apply kernel filter
      await applyKernelFilter(img, selectedKernel);

      // Simulate layer processing for architecture animation (conv layers only)
      await simulateLayerProcessing(img);

      setIsProcessing(false);
    } catch (err) {
      console.error("CNN processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process image");
      setIsProcessing(false);
    }
  };

  const drawImageWithDetections = (img: HTMLImageElement, detectionResults: any[]) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const offsetX = (canvas.width - img.width * scale) / 2;
    const offsetY = (canvas.height - img.height * scale) / 2;
    
    ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
    
    // Draw detection boxes
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.font = 'bold 16px Arial';
    
    detectionResults.forEach((detection: any) => {
      const [x, y, width, height] = detection.bbox;
      const scaledX = x * scale + offsetX;
      const scaledY = y * scale + offsetY;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      const label = `${detection.class} ${(detection.score * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(scaledX, scaledY - 25, textWidth + 10, 25);
      ctx.fillStyle = '#000000';
      ctx.fillText(label, scaledX + 5, scaledY - 7);
    });
  };

  const extractFeatureMaps = async (img: HTMLImageElement) => {
    try {
      // Simulate feature map extraction (simplified)
      const inputTensor = tf.browser.fromPixels(img).resizeBilinear([224, 224]);
      
      const maps: FeatureMap[] = [];
      
      // Simulated conv layers
      const layers = [
        { name: 'Conv2D_1 (32 filters)', size: 112, channels: 32 },
        { name: 'Conv2D_2 (64 filters)', size: 56, channels: 64 },
        { name: 'Conv2D_3 (128 filters)', size: 28, channels: 128 },
        { name: 'Conv2D_4 (256 filters)', size: 14, channels: 256 }
      ];
      
      for (const layer of layers) {
        const resized = inputTensor.resizeBilinear([layer.size, layer.size]);
        const gray = resized.mean(2);
        const data = await gray.array() as number[][];
        
        // Convert to 3D array
        const data3d: number[][][] = [];
        for (let i = 0; i < Math.min(layer.channels, 16); i++) {
          data3d.push(data.map(row => row.map(val => val / 255)));
        }
        
        maps.push({
          name: layer.name,
          data: data3d,
          width: layer.size,
          height: layer.size,
          channels: Math.min(layer.channels, 16)
        });
        
        gray.dispose();
        resized.dispose();
      }
      
      inputTensor.dispose();
      setFeatureMaps(maps);
    } catch (err) {
      console.error("Feature map extraction error:", err);
    }
  };

  useEffect(() => {
    if (!kernelOutput || !kernelCanvasRef.current) return;
    const canvas = kernelCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 224;
    canvas.height = 224;
    ctx.putImageData(kernelOutput, 0, 0);
  }, [kernelOutput]);

  const applyKernelFilter = async (img: HTMLImageElement, kernel: KernelFilter) => {
    try {
      const inputTensor = tf.browser.fromPixels(img)
        .resizeBilinear([224, 224])
        .mean(2)
        .expandDims(2)
        .expandDims(0)
        .div(255);

      const kernelTensor = tf.tensor4d(
        kernel.kernel.map(row => row.map(val => [[val]])),
        [kernel.size, kernel.size, 1, 1]
      );

      const conv = tf.conv2d(inputTensor as tf.Tensor4D, kernelTensor, 1, "same");
      const data = await (conv.squeeze() as tf.Tensor2D).array() as number[][];

      const imgData = new ImageData(224, 224);
      let idx = 0;

      // Find min/max for normalization
      let min = Infinity, max = -Infinity;
      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const val = Math.abs(data[y][x]);
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      }

      const range = max - min || 1;

      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const val = Math.abs(data[y][x]);
          const normalized = (val - min) / range;
          const v = Math.floor(normalized * 255);
          
          imgData.data[idx++] = v;
          imgData.data[idx++] = v;
          imgData.data[idx++] = v;
          imgData.data[idx++] = 255;
        }
      }

      setKernelOutput(imgData);

      inputTensor.dispose();
      kernelTensor.dispose();
      conv.dispose();
    } catch (err) {
      console.error("Kernel filter error:", err);
    }
  };

  const downloadCanvas = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) {
      console.error('Canvas not found for download');
      return;
    }
    
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const downloadFeatureMap = (layerIdx: number, channelIdx: number) => {
    const fmap = featureMaps[layerIdx];
    if (!fmap) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = fmap.width;
    canvas.height = fmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const channel = fmap.data[channelIdx];
    const imgData = ctx.createImageData(fmap.width, fmap.height);
    let idx = 0;
    
    for (let y = 0; y < fmap.height; y++) {
      for (let x = 0; x < fmap.width; x++) {
        const val = Math.floor(channel[y][x] * 255);
        imgData.data[idx++] = val;
        imgData.data[idx++] = val;
        imgData.data[idx++] = val;
        imgData.data[idx++] = 255;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    downloadCanvas(canvas, `featuremap_layer${layerIdx + 1}_channel${channelIdx + 1}.png`);
  };

  const simulateLayerProcessing = async (img: HTMLImageElement) => {
    try {
      const outputs: ImageData[] = [];
      for (const layer of architectureLayers) {
        if (layer.type === 'dense' || layer.type === 'softmax') {
          const size = 320;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const hasPreds = predictions.length > 0;
            if (layer.type === 'softmax' && hasPreds) {
              const imgData = buildSoftmaxImage(predictions, size);
              if (imgData) outputs.push(imgData);
            } else if (layer.type === 'dense' && hasPreds) {
              const imgData = buildDenseImage(predictions, size);
              if (imgData) outputs.push(imgData);
            } else {
              // Fallback: reuse last output to avoid blank frame
              if (outputs.length > 0) {
                const last = outputs[outputs.length - 1];
                const clone = new ImageData(new Uint8ClampedArray(last.data), last.width, last.height);
                outputs.push(clone);
              } else {
                ctx.fillStyle = '#0b1021';
                ctx.fillRect(0, 0, size, size);
                outputs.push(ctx.getImageData(0, 0, size, size));
              }
            }
          }
          continue;
        }

        const size = parseInt(layer.size.split('×')[0], 10) || 1;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(img, 0, 0, size, size);

        if (layer.type === 'pool') {
          const imgData = ctx.getImageData(0, 0, size, size);
          for (let j = 0; j < imgData.data.length; j += 4) {
            imgData.data[j] = imgData.data[j] * 0.7;
            imgData.data[j + 1] = imgData.data[j + 1] * 0.7 + 50;
            imgData.data[j + 2] = imgData.data[j + 2] * 0.7;
          }
          outputs.push(imgData);
          continue;
        }

        // Input and conv layers
        const inputTensor = tf.browser.fromPixels(canvas).resizeBilinear([size, size]);
        const gray = inputTensor.mean(2);
        const data = await gray.array() as number[][];

        const imgData = ctx.createImageData(size, size);
        let idx = 0;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const val = Math.floor((data[y][x] / 255) * 200 + 55);
            imgData.data[idx++] = val;
            imgData.data[idx++] = val * 0.8;
            imgData.data[idx++] = val * 0.6;
            imgData.data[idx++] = 255;
          }
        }
        outputs.push(imgData);
        inputTensor.dispose();
        gray.dispose();
      }

      setLayerOutputs(outputs);
      setCurrentLayer(0);
    } catch (err) {
      console.error('Layer simulation error:', err);
    }
  };

  const playArchitectureAnimation = () => {
    if (!imgRef.current || layerOutputs.length === 0) return;
    
    setIsPlayingAnimation(true);
    setCurrentLayer(0);
    
    let layer = 0;
    animationIntervalRef.current = setInterval(() => {
      layer++;
      if (layer >= totalLayers) {
        setCurrentLayer(totalLayers - 1);
        stopArchitectureAnimation();
      } else {
        setCurrentLayer(layer);
      }
    }, 1500); // 1.5 seconds per layer
  };

  const stopArchitectureAnimation = () => {
    setIsPlayingAnimation(false);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  };

  const resetArchitectureAnimation = () => {
    stopArchitectureAnimation();
    setCurrentLayer(0);
  };

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur border-b border-primary/20 p-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text flex items-center gap-2">
                CNN Deep Learning Visualizer
                {modelLoaded && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </h1>
              <p className="text-xs text-textSecondary">
                Advanced CNN Architecture Analysis & Visualization
              </p>
            </div>
          </div>
          
          {isLoadingModel && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading Models...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card/30 backdrop-blur border-r border-primary/20 min-h-screen p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('detection')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'detection'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-textSecondary hover:bg-card/50'
              }`}
            >
              <Box className="w-5 h-5" />
              <span className="font-medium">Detection & Results</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'architecture'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-textSecondary hover:bg-card/50'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="font-medium">CNN Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'features'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-textSecondary hover:bg-card/50'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
              <span className="font-medium">Feature Maps</span>
            </button>

            <button
              onClick={() => setActiveTab('kernels')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'kernels'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-textSecondary hover:bg-card/50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Kernel Filters</span>
            </button>

          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-textSecondary leading-relaxed">
                Upload an image to explore CNN internals, feature maps, and visualization techniques used in deep learning.
              </p>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 p-6">
          {/* Upload Section */}
          <div className="bg-card/50 backdrop-blur rounded-xl p-4 border border-primary/20 mb-6">
            <div className="flex items-center gap-3">
              <label className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-lg cursor-pointer transition-all ${
                modelLoaded 
                  ? 'bg-primary hover:bg-primary/80 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}>
                <Upload className="w-5 h-5" />
                <span className="font-medium">
                  {isLoadingModel ? 'Loading Model...' : imageURL ? 'Upload New Image' : 'Upload Image'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={loadImage}
                  disabled={!modelLoaded}
                  className="hidden"
                />
              </label>
              
              {imageURL && (
                <button
                  onClick={clearImage}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all border border-red-500/20"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Clear</span>
                </button>
              )}
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'detection' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Display */}
              <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Input Image with Detections
                </h2>
                
                <div className="bg-gradient-to-br from-black to-gray-900 rounded-lg border border-primary/20 flex items-center justify-center relative overflow-hidden" style={{ height: '400px' }}>
                  <canvas 
                    ref={canvasRef}
                    width={600}
                    height={600}
                    className="rounded shadow-2xl" 
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: imageURL ? 'block' : 'none'
                    }} 
                  />
                  
                  {!imageURL && !isProcessing && (
                    <div className="text-center text-textSecondary p-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 opacity-40" />
                      </div>
                      <p className="text-lg font-medium">No image uploaded</p>
                      <p className="text-sm opacity-60 mt-1">Upload to begin analysis</p>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium text-text">Analyzing...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              {(predictions.length > 0 || detections.length > 0) && (
                <div className="space-y-4">
                  {/* Detections */}
                  {detections.length > 0 && (
                    <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-green-500/20">
                      <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                        <Box className="w-5 h-5 text-green-500" />
                        Object Detection
                      </h2>
                      
                      <div className="space-y-2">
                        {detections.map((det, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-green-400 capitalize">{det.class}</span>
                              <span className="text-sm font-mono text-green-400">{(det.score * 100).toFixed(1)}%</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-black/50 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${det.score * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classifications */}
                  {predictions.length > 0 && (
                    <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-blue-500/20">
                      <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-400" />
                        Classification
                      </h2>
                      
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {predictions.slice(0, 5).map((pred, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${idx === 0 ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-black/20'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-text">{pred.className}</span>
                              <span className="text-xs font-mono text-textSecondary">{(pred.probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pred.probability * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Animation Controls */}
              {imageURL && layerOutputs.length > 0 && (
                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-text flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-primary animate-pulse" />
                        Live CNN Processing
                      </h2>
                      <p className="text-sm text-textSecondary">
                        Watch your image flow through each layer in real-time
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isPlayingAnimation ? (
                        <button
                          onClick={playArchitectureAnimation}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all border border-green-500/40"
                        >
                          <Play className="w-4 h-4" />
                          <span className="font-medium">Play</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopArchitectureAnimation}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-all border border-yellow-500/40"
                        >
                          <Pause className="w-4 h-4" />
                          <span className="font-medium">Pause</span>
                        </button>
                      )}
                      
                      <button
                        onClick={resetArchitectureAnimation}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="font-medium">Reset</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalLayers > 1 ? (currentLayer / (totalLayers - 1)) * 100 : 0}%` }}
                    />
                  </div>
                  
                  <div className="mt-2 text-sm text-textSecondary text-center">
                    Layer {currentLayer + 1} of {totalLayers} • {totalLayers > 1 ? Math.round((currentLayer / (totalLayers - 1)) * 100) : 0}% Complete
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Output Display */}
                {imageURL && layerOutputs.length > 0 && (
                  <div className="lg:col-span-1">
                    <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20 sticky top-6">
                      <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-green-500" />
                        Layer Output
                      </h2>
                      <div className="bg-black rounded-lg border border-green-500/20 p-4 flex items-center justify-center relative overflow-hidden">
                        <button
                          type="button"
                          className="w-full h-auto rounded transition-all duration-500"
                          onClick={() => {
                            if (layerOutputs[currentLayer]) setIsOutputModalOpen(true);
                          }}
                        >
                          <canvas
                            width={320}
                            height={320}
                            className="w-full h-auto rounded transition-all duration-500"
                            ref={(canvas) => {
                              if (!canvas || !layerOutputs[currentLayer]) return;
                              const ctx = canvas.getContext('2d');
                              if (!ctx) return;
                            ctx.imageSmoothingEnabled = false;
                              
                              const output = layerOutputs[currentLayer];
                              const tempCanvas = document.createElement('canvas');
                              tempCanvas.width = output.width;
                              tempCanvas.height = output.height;
                              const tempCtx = tempCanvas.getContext('2d');
                              if (tempCtx) {
                              tempCtx.imageSmoothingEnabled = false;
                                tempCtx.putImageData(output, 0, 0);
                                ctx.clearRect(0, 0, 320, 320);
                                ctx.drawImage(tempCanvas, 0, 0, 320, 320);
                              }
                            }}
                          />
                        </button>
                        
                        {isPlayingAnimation && (
                          <div className="absolute inset-0 border-4 border-green-500 rounded animate-pulse pointer-events-none" />
                        )}
                      </div>
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-textSecondary">
                          <strong className="text-green-400">Current:</strong> Layer {currentLayer + 1}{' '}
                          {isPlayingAnimation
                            ? 'processing'
                            : currentLayer === totalLayers - 1
                            ? 'completed'
                            : 'idle'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                  {/* Architecture Layers */}
                <div className={`${imageURL && layerOutputs.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                  <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                    <h2 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      MobileNet v2 Architecture
                    </h2>
                    
                    <div className="space-y-4">
                      {architectureLayers.map((layer, idx) => {
                        const isActive = currentLayer === idx;
                        const isComplete = currentLayer > idx || (!isPlayingAnimation && currentLayer >= idx && idx === architectureLayers.length - 1);
                        const baseStyle = layer.type === 'dense' || layer.type === 'softmax'
                          ? 'bg-black/40 border-primary/30'
                          : 'bg-black/30 border-primary/20';
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-500 ${
                              isActive
                                ? 'bg-primary/20 border-primary/60 shadow-lg scale-105'
                                : isComplete
                                ? 'bg-green-500/10 border-green-500/20'
                                : baseStyle
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg bg-${layer.color}-500/20 border border-${layer.color}-500/40 flex items-center justify-center flex-shrink-0 relative`}>
                              <span className="text-2xl font-bold text-text">{idx + 1}</span>
                              {isActive && (
                                <div className="absolute inset-0 rounded-lg border-2 border-primary animate-ping" />
                              )}
                              {isComplete && (
                                <CheckCircle2 className="absolute -top-1 -right-1 w-5 h-5 text-green-500 bg-black rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-semibold mb-1 ${isActive ? 'text-primary' : 'text-text'}`}>
                                {layer.name}
                              </h3>
                              <p className="text-sm text-textSecondary">{layer.desc}</p>
                              <p className="text-xs text-primary/60 mt-1">Output: {layer.size}</p>
                              {(layer.type === 'dense' || layer.type === 'softmax') && (
                                <div className="mt-2 text-xs text-textSecondary bg-black/40 border border-primary/20 rounded px-3 py-2 inline-flex items-center gap-2">
                                  <span className="font-semibold text-primary">{layer.type === 'dense' ? 'Collapsed' : 'Top-5'}</span>
                                  {layer.type === 'softmax' && predictions.length > 0 && (
                                    <span className="text-[11px] text-textSecondary">
                                      {predictions.map(p => `${p.className.split(',')[0]} ${(p.probability * 100).toFixed(1)}%`).slice(0, 5).join(' • ')}
                                    </span>
                                  )}
                                  {layer.type === 'dense' && <span className="text-textSecondary">Hidden activations summarized</span>}
                                </div>
                              )}
                            </div>
                            {idx < architectureLayers.length - 1 && (
                              <ChevronRight className={`w-5 h-5 ${isComplete || isActive ? 'text-green-500 animate-pulse' : 'text-primary'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm text-textSecondary">
                        <strong className="text-primary">Total Parameters:</strong> ~3.5 million trainable weights trained on 14M ImageNet images over 1000 categories.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isOutputModalOpen && layerOutputs[currentLayer] && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOutputModalOpen(false)}>
              <div className="bg-card/80 border border-primary/30 rounded-xl p-4 relative max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <button
                  className="absolute top-3 right-3 text-textSecondary hover:text-text"
                  onClick={() => setIsOutputModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-text mb-3">Layer {currentLayer + 1} Output</h3>
                <div className="flex justify-center">
                  <canvas
                    width={480}
                    height={480}
                    className="w-full max-w-[480px] max-h-[80vh] h-auto rounded-lg border border-primary/20 object-contain"
                    ref={(canvas) => {
                      if (!canvas || !layerOutputs[currentLayer]) return;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      ctx.imageSmoothingEnabled = false;
                      const output = layerOutputs[currentLayer];
                      const tempCanvas = document.createElement('canvas');
                      tempCanvas.width = output.width;
                      tempCanvas.height = output.height;
                      const tempCtx = tempCanvas.getContext('2d');
                      if (tempCtx) {
                        tempCtx.imageSmoothingEnabled = false;
                        tempCtx.putImageData(output, 0, 0);
                        ctx.clearRect(0, 0, 480, 480);
                        ctx.drawImage(tempCanvas, 0, 0, 480, 480);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && featureMaps.length > 0 && (
            <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5 text-primary" />
                  Feature Map Visualization
                </h2>
                <div className="flex items-center gap-2">
                  {selectedFeatureMap !== null && (
                    <button
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all"
                    >
                      {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      <span className="text-sm">{isZoomed ? 'Grid View' : 'Zoom'}</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                {featureMaps.map((fmap, layerIdx) => (
                  <div key={layerIdx} className="p-4 bg-black/30 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-text mb-4">{fmap.name}</h3>
                    <div className={`grid gap-2 ${isZoomed && selectedFeatureMap === layerIdx ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-4 md:grid-cols-8'}`}>
                      {fmap.data.slice(0, 16).map((channel, chIdx) => (
                        <div 
                          key={chIdx} 
                          className="relative group"
                        >
                          <canvas
                            width={fmap.width}
                            height={fmap.height}
                            className="w-full h-auto rounded border border-primary/20 hover:border-primary/60 transition-all cursor-pointer"
                            onClick={() => setSelectedFeatureMap(selectedFeatureMap === layerIdx ? null : layerIdx)}
                            ref={(canvas) => {
                              if (!canvas) return;
                              const ctx = canvas.getContext('2d');
                              if (!ctx) return;
                              
                              const imgData = ctx.createImageData(fmap.width, fmap.height);
                              let idx = 0;
                              for (let y = 0; y < fmap.height; y++) {
                                for (let x = 0; x < fmap.width; x++) {
                                  const val = Math.floor(channel[y][x] * 255);
                                  imgData.data[idx++] = val;
                                  imgData.data[idx++] = val;
                                  imgData.data[idx++] = val;
                                  imgData.data[idx++] = 255;
                                }
                              }
                              ctx.putImageData(imgData, 0, 0);
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                            {chIdx + 1}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFeatureMap(layerIdx, chIdx);
                            }}
                            className="absolute bottom-1 right-1 bg-primary/80 hover:bg-primary p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                            title="Download feature map"
                          >
                            <Download className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kernels' && (
            <div className="space-y-6">
              {/* Kernel Selection */}
              <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Select Kernel Filter
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {predefinedKernels.map((kernel, idx) => (
                    <div
                      key={idx}
                      onClick={async () => {
                        setSelectedKernel(kernel);
                        if (imgRef.current && imageURL) {
                          await applyKernelFilter(imgRef.current, kernel);
                        }
                      }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedKernel.name === kernel.name
                          ? 'bg-primary/20 border-primary/40 shadow-lg ring-2 ring-primary/50'
                          : 'bg-black/30 border-primary/20 hover:border-primary/40 hover:bg-black/40'
                      }`}
                    >
                      <h3 className="font-semibold text-text mb-2">{kernel.name}</h3>
                      <p className="text-xs text-textSecondary mb-3 line-clamp-2">{kernel.purpose}</p>
                      
                      {/* Kernel Matrix Visualization */}
                      <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
                        {kernel.kernel.map((row, y) =>
                          row.map((val, x) => (
                            <div
                              key={`${y}-${x}`}
                              className="w-8 h-8 rounded border border-primary/40 flex items-center justify-center text-xs font-mono"
                              style={{
                                backgroundColor: val > 0 ? `rgba(0, 255, 0, ${Math.abs(val)})` : val < 0 ? `rgba(255, 0, 0, ${Math.abs(val)})` : 'rgba(100, 100, 100, 0.3)'
                              }}
                            >
                              {val.toFixed(1)}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Comparison */}
              {imageURL && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Image */}
                  <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                    <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                      Original Image
                    </h2>
                    
                    <div className="bg-black rounded-lg border border-blue-500/20 p-4 flex items-center justify-center">
                      <canvas
                        width={224}
                        height={224}
                        className="w-full h-auto rounded max-w-md"
                        ref={(canvas) => {
                          if (!canvas || !imgRef.current) return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          ctx.clearRect(0, 0, 224, 224);
                          ctx.drawImage(imgRef.current, 0, 0, 224, 224);
                        }}
                      />
                    </div>
                  </div>

                  {/* Kernel Output */}
                  <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                        <Eye className="w-5 h-5 text-green-400" />
                        Filtered Output
                      </h2>
                      {kernelOutput && (
                        <button
                          onClick={() => downloadCanvas(kernelCanvasRef.current, `kernel_${selectedKernel.name.replace(/\s+/g, '_')}.png`)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-black rounded-lg border border-green-500/20 p-4 flex items-center justify-center">
                      {kernelOutput ? (
                        <canvas
                          ref={kernelCanvasRef}
                          width={224}
                          height={224}
                          className="w-full h-auto rounded max-w-md"
                          style={{ imageRendering: 'auto' }}
                        />
                      ) : (
                        <div className="text-center text-textSecondary py-20">
                          <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Select a kernel filter above</p>
                        </div>
                      )}
                    </div>
                    
                    {kernelOutput && (
                      <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-textSecondary">
                          <strong className="text-primary">Applied:</strong> {selectedKernel.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info message when no image */}
          {!imageURL && activeTab !== 'architecture' && (
            <div className="bg-card/50 backdrop-blur rounded-xl p-8 border border-primary/20 text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30 text-primary" />
              <h3 className="text-xl font-semibold text-text mb-2">No Image Uploaded</h3>
              <p className="text-textSecondary mb-4">
                Upload an image to explore CNN visualization features
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg cursor-pointer transition-all">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={loadImage}
                  disabled={!modelLoaded}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
