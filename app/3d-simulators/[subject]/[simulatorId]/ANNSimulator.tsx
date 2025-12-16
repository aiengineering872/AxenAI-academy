"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Info, Zap } from "lucide-react";

type ActivationKey = "sigmoid" | "tanh" | "relu" | "leakyRelu";
type DataType = "xor" | "and" | "or" | "circle";

interface Sample {
  input: [number, number];
  output: [number];
}

interface Network {
  weights1: number[][];
  weights2: number[][];
  bias1: number[];
  bias2: number[];
  hidden: number[];
  output: number[];
  inputValues: [number, number];
}

const ANNSimulator: React.FC = () => {
  const [dataType, setDataType] = useState<DataType>("xor");
  const [activationFn, setActivationFn] = useState<ActivationKey>("sigmoid");
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(1.0);
  const [network, setNetwork] = useState<Network | null>(null);
  const [currentSample, setCurrentSample] = useState<Sample | null>(null);
  const [accuracy, setAccuracy] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activations: Record<ActivationKey, (x: number) => number> = {
    sigmoid: (x) => 1 / (1 + Math.exp(-x)),
    tanh: (x) => Math.tanh(x),
    relu: (x) => Math.max(0, x),
    leakyRelu: (x) => (x > 0 ? x : 0.01 * x),
  };

  const activationDerivatives: Record<ActivationKey, (x: number) => number> = {
    sigmoid: (x) => x * (1 - x),
    tanh: (x) => 1 - x * x,
    relu: (x) => (x > 0 ? 1 : 0),
    leakyRelu: (x) => (x > 0 ? 1 : 0.01),
  };

  const datasets: Record<DataType, () => Sample[]> = {
    xor: () => [
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [0] },
    ],
    and: () => [
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [1] },
    ],
    or: () => [
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [1] },
    ],
    circle: () => {
      const data: Sample[] = [];
      for (let i = 0; i < 50; i++) {
        const x = Math.random();
        const y = Math.random();
        const dist = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
        data.push({ input: [x, y], output: [dist < 0.3 ? 1 : 0] });
      }
      return data;
    },
  };

  const initNetwork = useCallback((): Network => {
    const net: Network = {
      weights1: Array(2)
        .fill(0)
        .map(() => Array(4).fill(0).map(() => Math.random() * 2 - 1)),
      weights2: Array(4)
        .fill(0)
        .map(() => Array(1).fill(0).map(() => Math.random() * 2 - 1)),
      bias1: Array(4).fill(0).map(() => Math.random() * 2 - 1),
      bias2: Array(1).fill(0).map(() => Math.random() * 2 - 1),
      hidden: Array(4).fill(0),
      output: Array(1).fill(0),
      inputValues: [0, 0],
    };
    setNetwork(net);
    setEpoch(0);
    setLoss(1.0);
    setAccuracy(0);
    setCurrentSample(null);
    return net;
  }, []);

  const forward = (net: Network, input: [number, number]) => {
    const activate = activations[activationFn];
    net.inputValues = [...input];

    for (let i = 0; i < 4; i++) {
      let sum = net.bias1[i];
      for (let j = 0; j < 2; j++) sum += input[j] * net.weights1[j][i];
      net.hidden[i] = activate(sum);
    }

    for (let i = 0; i < 1; i++) {
      let sum = net.bias2[i];
      for (let j = 0; j < 4; j++) sum += net.hidden[j] * net.weights2[j][i];
      net.output[i] = activate(sum);
    }
    return net.output[0];
  };

  const backward = (net: Network, input: [number, number], target: number, lr = 0.1) => {
    const derivative = activationDerivatives[activationFn];
    const outputError = target - net.output[0];
    const outputDelta = outputError * derivative(net.output[0]);

    const hiddenDeltas: number[] = [];
    for (let i = 0; i < 4; i++) {
      const error = outputDelta * net.weights2[i][0];
      hiddenDeltas.push(error * derivative(net.hidden[i]));
    }

    for (let i = 0; i < 4; i++) net.weights2[i][0] += lr * outputDelta * net.hidden[i];
    net.bias2[0] += lr * outputDelta;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 4; j++) {
        net.weights1[i][j] += lr * hiddenDeltas[j] * input[i];
      }
    }
    for (let i = 0; i < 4; i++) net.bias1[i] += lr * hiddenDeltas[i];

    return outputError * outputError;
  };

  const calculateAccuracy = (net: Network, data: Sample[]) => {
    let correct = 0;
    for (const sample of data) {
      const prediction = forward(net, sample.input);
      const predicted = prediction > 0.5 ? 1 : 0;
      if (predicted === sample.output[0]) correct++;
    }
    return (correct / data.length) * 100;
  };

  const trainStep = useCallback(() => {
    if (!network) return;
    const data = datasets[dataType]();
    let totalLoss = 0;

    for (const sample of data) {
      forward(network, sample.input);
      const sampleLoss = backward(network, sample.input, sample.output[0]);
      totalLoss += sampleLoss;
    }

    const avgLoss = totalLoss / data.length;
    const acc = calculateAccuracy(network, data);

    setLoss(avgLoss);
    setAccuracy(acc);
    setEpoch((prev) => prev + 1);

    const randomSample = data[Math.floor(Math.random() * data.length)];
    forward(network, randomSample.input);
    setCurrentSample(randomSample);
    setNetwork({ ...network });

    if (avgLoss < 0.01 && acc >= 99) setIsTraining(false);
  }, [network, dataType]);

  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !network) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const layers = [
      [
        { x: w * 0.15, y: h * 0.35 },
        { x: w * 0.15, y: h * 0.65 },
      ],
      [
        { x: w * 0.45, y: h * 0.2 },
        { x: w * 0.45, y: h * 0.4 },
        { x: w * 0.45, y: h * 0.6 },
        { x: w * 0.45, y: h * 0.8 },
      ],
      [{ x: w * 0.75, y: h * 0.5 }],
    ];

    const time = Date.now() / 500;
    ctx.lineWidth = 2;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 4; j++) {
        const weight = network.weights1[i][j];
        const alpha = Math.min(Math.abs(weight) * 0.8, 0.9);
        ctx.strokeStyle = weight > 0 ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(layers[0][i].x, layers[0][i].y);
        ctx.lineTo(layers[1][j].x, layers[1][j].y);
        ctx.stroke();

        if (isTraining) {
          const progress = time % 1;
          const x = layers[0][i].x + (layers[1][j].x - layers[0][i].x) * progress;
          const y = layers[0][i].y + (layers[1][j].y - layers[0][i].y) * progress;
          ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      const weight = network.weights2[i][0];
      const alpha = Math.min(Math.abs(weight) * 0.8, 0.9);
      ctx.strokeStyle = weight > 0 ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(layers[1][i].x, layers[1][i].y);
      ctx.lineTo(layers[2][0].x, layers[2][0].y);
      ctx.stroke();

      if (isTraining) {
        const progress = time % 1;
        const x = layers[1][i].x + (layers[2][0].x - layers[1][i].x) * progress;
        const y = layers[1][i].y + (layers[2][0].y - layers[1][i].y) * progress;
        ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    layers.forEach((layer, layerIdx) => {
      layer.forEach((neuron, neuronIdx) => {
        let value = 0;
        if (layerIdx === 0) value = network.inputValues[neuronIdx] ?? 0;
        else if (layerIdx === 1) value = network.hidden[neuronIdx] ?? 0;
        else value = network.output[0] ?? 0;

        const intensity = Math.min(Math.abs(value), 1);

        const gradient = ctx.createRadialGradient(neuron.x, neuron.y, 0, neuron.x, neuron.y, 25);
        gradient.addColorStop(0, `rgba(34, 197, 94, ${intensity * 0.8})`);
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(20, 20, 25, 0.9)";
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(34, 197, 94, ${0.5 + intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(value.toFixed(2), neuron.x, neuron.y);
      });
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("INPUT", w * 0.15, h * 0.1);
    ctx.fillText("HIDDEN", w * 0.45, h * 0.1);
    ctx.fillText("OUTPUT", w * 0.75, h * 0.1);
  }, [network, isTraining]);

  useEffect(() => {
    if (isTraining) {
      trainingIntervalRef.current = setInterval(() => {
        trainStep();
      }, 100);
    } else if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
    return () => {
      if (trainingIntervalRef.current) {
        clearInterval(trainingIntervalRef.current);
        trainingIntervalRef.current = null;
      }
    };
  }, [isTraining, trainStep]);

  useEffect(() => {
    drawNetwork();
  }, [drawNetwork]);

  useEffect(() => {
    initNetwork();
  }, [initNetwork]);

  const handleReset = () => {
    setIsTraining(false);
    initNetwork();
  };

  const handleDataTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsTraining(false);
    setDataType(e.target.value as DataType);
    initNetwork();
  };

  const handleActivationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsTraining(false);
    setActivationFn(e.target.value as ActivationKey);
    initNetwork();
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Zap className="text-yellow-400" /> Neural Network Simulator
          </h1>
          <p className="text-slate-400">Watch AI Learn in Real-Time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          <div className="w-full min-w-[260px] sm:min-w-[300px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">⚙️</span> Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2 font-semibold text-sm">Dataset Type</label>
                <select
                  value={dataType}
                  onChange={handleDataTypeChange}
                  className="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-600 focus:border-blue-500 focus:outline-none cursor-pointer"
                  disabled={isTraining}
                  style={{
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="xor">XOR Gate</option>
                  <option value="and">AND Gate</option>
                  <option value="or">OR Gate</option>
                  <option value="circle">Circle Pattern</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 font-semibold text-sm">Activation Function</label>
                <select
                  value={activationFn}
                  onChange={handleActivationChange}
                  className="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-600 focus:border-blue-500 focus:outline-none cursor-pointer"
                  disabled={isTraining}
                  style={{
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="sigmoid">Sigmoid</option>
                  <option value="tanh">Tanh</option>
                  <option value="relu">ReLU</option>
                  <option value="leakyRelu">Leaky ReLU</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setIsTraining((prev) => !prev)}
                  className={`w-full sm:flex-1 ${
                    isTraining ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
                  } text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg`}
                >
                  {isTraining ? (
                    <>
                      <Pause size={18} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Train
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition shadow-lg"
                  title="Reset Network"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg p-3 border border-blue-700/50">
                <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Epoch:</span>
                    <span className="font-bold text-blue-300">{epoch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Loss:</span>
                    <span className="font-bold text-blue-300">{loss.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Accuracy:</span>
                    <span className="font-bold text-green-400">{accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {currentSample && network && (
                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-lg p-3 border border-purple-700/50">
                  <h3 className="text-white font-semibold text-sm mb-2">Current Sample</h3>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Input: [{currentSample.input.join(", ")}]</div>
                    <div>Target: {currentSample.output[0]}</div>
                    <div>Predicted: {network.output[0].toFixed(3)}</div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-3 border border-slate-600">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold mb-1 text-yellow-400">Live Processing</p>
                    <p>Yellow dots show data flowing through connections. Network stops when accuracy ≥ 99%!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">🎨 Network Visualization</h2>
            <div className="bg-black rounded-lg p-4 border border-slate-700">
              <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-lg p-3 border border-blue-700/50">
                <h3 className="text-white font-semibold text-sm mb-1">🔵 Positive Weights</h3>
                <p className="text-blue-300 text-xs">Blue = Excitatory connections</p>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-lg p-3 border border-red-700/50">
                <h3 className="text-white font-semibold text-sm mb-1">🔴 Negative Weights</h3>
                <p className="text-red-300 text-xs">Red = Inhibitory connections</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg p-3 border border-green-700/50">
                <h3 className="text-white font-semibold text-sm mb-1">🟢 Activation Level</h3>
                <p className="text-green-300 text-xs">Brightness = Neuron strength</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ANNSimulator;
