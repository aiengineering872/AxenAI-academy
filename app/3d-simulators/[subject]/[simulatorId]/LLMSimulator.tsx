import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

// Educational LLM Simulator Component - WITH EDITABLE INPUT
// Processes user input in real-time using pure frontend logic

// Simple tokenization function (splits by spaces and punctuation)
function tokenizeText(text: string) {
  if (!text.trim()) return [];
  // Split by spaces but keep punctuation as separate tokens
  return text
    .split(/(\s+|[.,!?;:])/)
    .filter(t => t.trim().length > 0)
    .map(t => t);
}

// Generate mock embeddings based on token text (deterministic)
function generateEmbedding(token: string) {
  // Simple hash-like function to generate consistent vectors from text
  const nums: number[] = [];
  for (let i = 0; i < 4; i++) {
    let sum = 0;
    for (let j = 0; j < token.length; j++) {
      sum += token.charCodeAt(j) * (i + 1) * (j + 1);
    }
    nums.push((Math.sin(sum) + 1) / 2); // Normalize to 0-1
  }
  return nums;
}

// Generate attention weights (how much each token attends to others)
function generateAttention(tokens: string[]) {
  const n = tokens.length;
  const attention: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    const weights: number[] = [];
    for (let j = 0; j < n; j++) {
      // Higher weight for self and adjacent tokens
      if (i === j) {
        weights.push(0.6);
      } else if (Math.abs(i - j) === 1) {
        weights.push(0.3);
      } else {
        weights.push(0.1);
      }
    }
    // Normalize weights to sum to 1
    const sum = weights.reduce((a, b) => a + b, 0);
    attention.push(weights.map(w => w / sum));
  }
  
  return attention;
}

// Transform embeddings (simulate transformer processing)
function transformEmbeddings(embeddings: number[][], attention: number[][]) {
  return embeddings.map((emb, i) => {
    // Apply attention-weighted combination
    return emb.map((val, dim) => {
      let newVal = 0;
      attention[i].forEach((weight, j) => {
        newVal += weight * embeddings[j][dim];
      });
      return Math.min(1, Math.max(0, newVal + (Math.random() - 0.5) * 0.2));
    });
  });
}

// Generate output text (simple concatenation with punctuation)
function generateOutput(tokens: string[]) {
  return tokens
    .join('')
    .replace(/\s+([.,!?;:])/g, '$1') // Remove space before punctuation
    .trim() + '!';
}

const STEPS = [
  { id: 0, name: "Input", desc: "Raw text entered by user" },
  { id: 1, name: "Tokenization", desc: "Breaking text into smaller units (tokens)" },
  { id: 2, name: "Embedding", desc: "Converting tokens to numerical vectors" },
  { id: 3, name: "Self-Attention", desc: "Tokens attend to each other for context" },
  { id: 4, name: "Transformer Block", desc: "Processing vectors with learned patterns" },
  { id: 5, name: "Output", desc: "Generating the final result" }
];

export default function LLMSimulator() {
  // User input state
  const [inputText, setInputText] = useState("Hello world");
  const [processedData, setProcessedData] = useState<{
    tokens: string[];
    embeddings: number[][];
    attention: number[][];
    transformed: number[][];
    output: string;
  } | null>(null);
  
  // Simulation state
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedToken, setHighlightedToken] = useState<number | null>(null);

  // Process input whenever it changes
  useEffect(() => {
    const tokens = tokenizeText(inputText);
    if (tokens.length === 0) {
      setProcessedData(null);
      return;
    }
    
    const embeddings = tokens.map(generateEmbedding);
    const attention = generateAttention(tokens);
    const transformed = transformEmbeddings(embeddings, attention);
    const output = generateOutput(tokens);
    
    setProcessedData({
      tokens,
      embeddings,
      attention,
      transformed,
      output
    });
  }, [inputText]);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !processedData) return;
    
    const timer = setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, processedData]);

  // Control handlers
  const handlePlay = () => {
    if (!processedData) return;
    if (currentStep === STEPS.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleNext = () => {
    if (!processedData || currentStep >= STEPS.length - 1) return;
    setCurrentStep(prev => prev + 1);
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedToken(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    // Reset to step 0 when input changes
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">LLM Simulator</h1>
          <p className="text-gray-400">
            Educational visualization of how Large Language Models process text
          </p>
        </div>

        {/* Input Box */}
        <div className="mb-8">
          <label htmlFor="text-input" className="block text-sm font-medium mb-2 text-gray-300">
            Enter your text (try different inputs!)
          </label>
          <input
            id="text-input"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition"
            placeholder="Type something..."
            autoComplete="off"
            spellCheck="false"
          />
          <p className="text-xs text-gray-500 mt-1">
            Changes are processed instantly - watch how different inputs are tokenized and processed!
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      idx === currentStep
                        ? 'bg-blue-500 scale-110'
                        : idx < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="text-xs mt-2 text-center">{step.name}</div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      idx < currentStep ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Visualization Area */}
        {!processedData ? (
          <div className="bg-gray-800 rounded-lg p-8 mb-6 min-h-96 flex items-center justify-center">
            <p className="text-gray-500 text-lg">Enter some text to start the simulation</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 mb-6 min-h-96">
            <h2 className="text-2xl font-bold mb-2">{STEPS[currentStep].name}</h2>
            <p className="text-gray-400 mb-6">{STEPS[currentStep].desc}</p>

            {/* Step 0: Input */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded text-center text-xl">
                  "{inputText}"
                </div>
                <p className="text-sm text-gray-400">
                  This is the raw text input that will be processed by the model.
                </p>
              </div>
            )}

            {/* Step 1: Tokenization */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 justify-center flex-wrap">
                  {processedData.tokens.map((token, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-600 px-4 py-2 rounded text-lg font-mono animate-pulse"
                    >
                      {token}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Text is split into {processedData.tokens.length} token(s). Each token is a word, punctuation, or part of a word.
                </p>
              </div>
            )}

            {/* Step 2: Embeddings */}
            {currentStep === 2 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {processedData.embeddings.map((embedding, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-sm font-mono text-blue-400">
                      Token: "{processedData.tokens[idx]}"
                    </div>
                    <div className="flex gap-2">
                      {embedding.map((val, i) => (
                        <div key={i} className="flex-1">
                          <div className="bg-gray-700 h-24 rounded relative overflow-hidden">
                            <div
                              className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-blue-500 transition-all"
                              style={{ height: `${val * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-400">
                            {val.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-sm text-gray-400">
                  Each token is converted to a 4-dimensional vector. These numbers capture semantic meaning.
                </p>
              </div>
            )}

            {/* Step 3: Self-Attention */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex justify-around items-center py-8 flex-wrap gap-4">
                  {processedData.tokens.map((token, idx) => (
                    <div
                      key={idx}
                      className="relative"
                      onMouseEnter={() => setHighlightedToken(idx)}
                      onMouseLeave={() => setHighlightedToken(null)}
                    >
                      <div className="bg-blue-600 px-4 py-2 rounded cursor-pointer hover:bg-blue-500 transition">
                        {token}
                      </div>
                      {highlightedToken === idx && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-700 p-2 rounded text-xs whitespace-nowrap z-10">
                          {processedData.attention[idx].map((w, i) => (
                            <div key={i}>→ {processedData.tokens[i]}: {(w * 100).toFixed(0)}%</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-400">
                  Tokens "attend" to each other. Hover over tokens to see attention weights showing how much each token focuses on others.
                </p>
              </div>
            )}

            {/* Step 4: Transformer Block */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm text-gray-400 mb-2">Before (Embeddings)</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {processedData.embeddings.slice(0, 3).map((embedding, idx) => (
                        <div key={idx} className="flex gap-1">
                          {embedding.map((val, i) => (
                            <div
                              key={i}
                              className="flex-1 h-8 bg-purple-600 rounded flex items-center justify-center text-xs"
                            >
                              {val.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ))}
                      {processedData.embeddings.length > 3 && (
                        <p className="text-xs text-gray-500">+ {processedData.embeddings.length - 3} more...</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-2">After (Transformed)</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {processedData.transformed.slice(0, 3).map((embedding, idx) => (
                        <div key={idx} className="flex gap-1">
                          {embedding.map((val, i) => (
                            <div
                              key={i}
                              className="flex-1 h-8 bg-green-600 rounded flex items-center justify-center text-xs animate-pulse"
                            >
                              {val.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ))}
                      {processedData.transformed.length > 3 && (
                        <p className="text-xs text-gray-500">+ {processedData.transformed.length - 3} more...</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  The transformer processes vectors using attention weights, incorporating context from all tokens.
                </p>
              </div>
            )}

            {/* Step 5: Output */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded text-center text-2xl font-bold animate-pulse">
                  {processedData.output}
                </div>
                <p className="text-sm text-gray-400">
                  The final vectors are decoded back to text. The model has processed and understood the input!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={!processedData}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleNext}
            disabled={!processedData || currentStep === STEPS.length - 1}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward size={20} />
            Next Step
          </button>
          <button
            onClick={handleReset}
            disabled={!processedData}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        {/* Educational Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This is a simplified educational model using frontend-only processing.</p>
          <p>Real LLMs have billions of parameters and thousands of dimensions.</p>
        </div>
      </div>
    </div>
  );
}

