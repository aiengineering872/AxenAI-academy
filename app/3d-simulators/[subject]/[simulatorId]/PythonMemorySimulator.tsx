'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, 
  FileText, Brain, Box, Lightbulb, Code, Zap, Info
} from 'lucide-react';
import { parsePythonCode, ExecutionStep, getTypeColor, isMutableType, MemoryObject } from './utils/pythonMemoryParser';

const PRESET_EXAMPLES = {
  'variable-assignment': {
    name: 'Variable Assignment',
    code: `a = 10
b = a
a = 20`,
    description: 'Shows how immutable objects work with reassignment'
  },
  'list-reference': {
    name: 'List Reference',
    code: `a = [1, 2, 3]
b = a
a.append(4)`,
    description: 'Demonstrates shared references with mutable objects'
  },
  'list-copy': {
    name: 'List Copy',
    code: `a = [1, 2, 3]
b = a.copy()
a.append(4)`,
    description: 'Shows the difference between reference and copy'
  },
  'dictionary': {
    name: 'Dictionary Mutation',
    code: `d = {'x': 1, 'y': 2}
e = d
d['z'] = 3`,
    description: 'Illustrates dictionary mutations and shared references'
  },
  'tuple-immutable': {
    name: 'Tuple Immutability',
    code: `t = (1, 2, 3)
u = t
# Tuples are immutable, cannot modify`,
    description: 'Demonstrates immutable tuple behavior'
  },
  'set-operations': {
    name: 'Set Operations',
    code: `s = {1, 2, 3}
s.add(4)
s.remove(2)`,
    description: 'Shows set mutations and in-place operations'
  },
};

export default function PythonMemorySimulator() {
  const [code, setCode] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(2000); // milliseconds
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load preset
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey && PRESET_EXAMPLES[presetKey as keyof typeof PRESET_EXAMPLES]) {
      setCode(PRESET_EXAMPLES[presetKey as keyof typeof PRESET_EXAMPLES].code);
    }
  };

  // Parse and prepare execution steps
  const handleRunSimulation = () => {
    if (!code.trim()) {
      alert('Please enter some Python code or select a preset example.');
      return;
    }

    try {
      // Stop any running auto-play
      setIsAutoPlaying(false);
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }

      let steps: ExecutionStep[] = [];
      try {
        steps = parsePythonCode(code);
      } catch (parseError) {
        console.error('Parse error caught:', parseError);
        alert('Error parsing code. Please check your syntax and try again.');
        return;
      }
      
      if (!Array.isArray(steps) || steps.length === 0) {
        alert('No valid Python code found. Please check your code and try again.');
        return;
      }
      
      // Validate steps before setting
      const validSteps = steps.filter((step): step is ExecutionStep => 
        step !== null && 
        step !== undefined && 
        typeof step === 'object' &&
        typeof step.lineNumber === 'number' &&
        typeof step.code === 'string'
      );
      
      if (validSteps.length === 0) {
        alert('No valid execution steps generated. Please check your code.');
        return;
      }
      
      setExecutionSteps(validSteps);
      setCurrentStep(0);
    } catch (error: any) {
      alert(`Error parsing code: ${error.message}`);
      console.error('Parse error:', error);
    }
  };

  // Reset simulation
  const handleReset = () => {
    setExecutionSteps([]);
    setCurrentStep(-1);
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
  };

  // Navigate steps
  const handleNext = () => {
    if (currentStep < executionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsAutoPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsAutoPlaying(false);
    }
  };

  // Auto-play
  const handleRunAll = () => {
    if (executionSteps.length === 0) {
      handleRunSimulation();
      // Wait for steps to be set, then start auto-play
      setTimeout(() => {
        setIsAutoPlaying(true);
      }, 100);
      return;
    }
    setCurrentStep(0);
    setIsAutoPlaying(true);
  };

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying && currentStep >= 0 && currentStep < executionSteps.length) {
      // Clear any existing timer
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }

      autoPlayTimerRef.current = setTimeout(() => {
        if (currentStep < executionSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsAutoPlaying(false);
        }
      }, autoPlaySpeed);

      return () => {
        if (autoPlayTimerRef.current) {
          clearTimeout(autoPlayTimerRef.current);
        }
      };
    } else {
      // Clear timer when not auto-playing
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    }
  }, [isAutoPlaying, currentStep, executionSteps.length, autoPlaySpeed]);

  // Get current state with safety checks
  const currentState = (() => {
    if (currentStep < 0 || currentStep >= executionSteps.length) {
      return null;
    }
    const step = executionSteps[currentStep];
    if (!step || typeof step !== 'object') {
      return null;
    }
    // Ensure step has required properties
    if (!step.variables || !Array.isArray(step.variables)) {
      step.variables = [];
    }
    if (!step.memoryObjects || typeof step.memoryObjects !== 'object') {
      step.memoryObjects = {};
    }
    return step;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-text flex items-center gap-3">
            <Brain className="text-primary" size={36} />
            Python Memory & Variable Flow Simulator
          </h1>
          <p className="text-textSecondary">
            Visualize how Python stores variables in memory, handles references, and manages mutability
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Code Input */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-text">Python Code Input</h2>
              </div>

              {/* Preset Examples */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-textSecondary mb-2">
                  Preset Examples:
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-black/50 border border-primary/20 rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
                >
                  <option value="">Select an example...</option>
                  {Object.entries(PRESET_EXAMPLES).map(([key, example]) => (
                    <option key={key} value={key}>
                      {example.name}
                    </option>
                  ))}
                </select>
                {selectedPreset && PRESET_EXAMPLES[selectedPreset as keyof typeof PRESET_EXAMPLES] && (
                  <p className="text-xs text-textSecondary mt-2">
                    {PRESET_EXAMPLES[selectedPreset as keyof typeof PRESET_EXAMPLES].description}
                  </p>
                )}
              </div>

              {/* Code Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-textSecondary mb-2">
                  Enter Python Code:
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Type your Python code here...&#10;&#10;Example:&#10;a = 10&#10;b = a&#10;a = 20"
                  className="w-full bg-black/50 border border-primary/20 rounded-lg p-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary min-h-[200px] font-mono text-sm"
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRunSimulation}
                  className="flex-1 bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  Run Simulation
                </button>
                <button
                  onClick={handleRunAll}
                  disabled={executionSteps.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Run All
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>

              {/* Supported Operations */}
              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-primary" />
                  <span className="text-xs font-semibold text-textSecondary">Supported Operations:</span>
                </div>
                <ul className="text-xs text-textSecondary space-y-1">
                  <li>• Variable assignment: <code className="text-primary">a = 10</code></li>
                  <li>• Reference assignment: <code className="text-primary">b = a</code></li>
                  <li>• Copy operation: <code className="text-primary">b = a.copy()</code></li>
                  <li>• List methods: <code className="text-primary">a.append(4)</code></li>
                  <li>• Dictionary ops: <code className="text-primary">d['key'] = 'value'</code></li>
                  <li>• Set operations: <code className="text-primary">s.add(1)</code></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Middle Panel: Memory Visualization */}
          <div className="lg:col-span-1 space-y-4">
            {/* Variables (Stack) */}
            <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-text">Variables (Stack)</h2>
              </div>
              
              {currentState ? (
                <div className="space-y-2 min-h-[150px]">
                  {currentState.variables && currentState.variables.length > 0 ? (
                    currentState.variables
                      .filter((variable): variable is { name: string; objectId: string | null } => 
                        variable !== null && 
                        variable !== undefined && 
                        typeof variable === 'object' &&
                        typeof variable.name === 'string'
                      )
                      .map((variable) => {
                        const isHighlighted = variable.name === currentState.highlightedVar;
                        const obj = variable.objectId && currentState.memoryObjects 
                          ? currentState.memoryObjects[variable.objectId] 
                          : null;
                        
                        return (
                          <motion.div
                            key={String(variable.name)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ 
                              opacity: 1, 
                              x: 0,
                              scale: isHighlighted ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                            className={`p-3 bg-black/50 rounded-lg border-2 transition-all ${
                              isHighlighted 
                                ? 'shadow-lg shadow-primary/50 border-primary' 
                                : 'border-primary/20'
                            }`}
                          >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-text">{variable.name}</span>
                            {variable.objectId ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-primary font-mono">{variable.objectId}</span>
                                {obj && (
                                  <span 
                                    className="px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                                    style={{ backgroundColor: getTypeColor(obj.type) }}
                                  >
                                    {obj.type}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-textSecondary">(deleted)</span>
                            )}
                          </div>
                          {obj && (
                            <div className="mt-1 flex items-center gap-2">
                              <ChevronRight size={12} className="text-primary" />
                              <span className="text-xs text-textSecondary">
                                {obj.isMutable ? 'mutable' : 'immutable'} object
                              </span>
                              {obj.references.length > 1 && (
                                <span className="text-xs text-primary">
                                  ({obj.references.length} references)
                                </span>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-textSecondary/50 italic text-center py-8">No variables yet</p>
                  )}
                </div>
              ) : (
                <p className="text-textSecondary/50 italic text-center py-8">No execution yet</p>
              )}
            </div>

            {/* Memory Objects (Heap) */}
            <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Box className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-text">Memory Objects (Heap)</h2>
              </div>
              
              {currentState ? (
                <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {currentState.memoryObjects && Object.values(currentState.memoryObjects).length > 0 ? (
                    Object.values(currentState.memoryObjects)
                      .filter((obj): obj is MemoryObject => 
                        obj !== null && 
                        obj !== undefined && 
                        typeof obj === 'object' &&
                        typeof obj.id === 'string' &&
                        obj.id.length > 0 &&
                        typeof obj.type === 'string'
                      )
                      .map((obj) => {
                        try {
                          const isHighlighted = obj.id === currentState.highlightedObj;
                          const color = getTypeColor(obj.type);
                          
                          return (
                            <motion.div
                              key={String(obj.id)}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0,
                                scale: isHighlighted ? 1.05 : 1,
                              }}
                              transition={{ duration: 0.3 }}
                              className={`p-4 bg-black/50 rounded-lg border-2 transition-all ${
                                isHighlighted ? 'shadow-lg' : ''
                              }`}
                              style={{
                                borderColor: isHighlighted && color ? color : 'rgba(220, 77, 1, 0.2)',
                                boxShadow: isHighlighted && color ? `0 0 20px ${color}` : undefined
                              }}
                            >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-text">{obj.id}</span>
                              <span 
                                className="px-2 py-1 rounded text-xs font-semibold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {obj.type}
                              </span>
                              {obj.isMutable && (
                                <span className="text-xs text-orange-400">(mutable)</span>
                              )}
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-sm text-textSecondary">Value: </span>
                            <span className="font-mono text-text">
                              {typeof obj.value === 'object' && obj.value !== null
                                ? JSON.stringify(obj.value)
                                : String(obj.value)}
                            </span>
                          </div>
                          {Array.isArray(obj.references) && obj.references.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-primary/20">
                              <span className="text-xs text-textSecondary">Referenced by: </span>
                              <span className="text-xs text-primary font-mono">
                                {obj.references.filter((ref): ref is string => typeof ref === 'string').join(', ')}
                              </span>
                            </div>
                          )}
                        </motion.div>
                          );
                        } catch (error) {
                          console.error('Error rendering memory object:', error, obj);
                          return null;
                        }
                      })
                      .filter((item) => item !== null)
                  ) : (
                    <p className="text-textSecondary/50 italic text-center py-8">No objects in memory</p>
                  )}
                </div>
              ) : (
                <p className="text-textSecondary/50 italic text-center py-8">No objects in memory</p>
              )}
            </div>
          </div>

          {/* Right Panel: Explanation & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Step Navigation */}
            {executionSteps.length > 0 && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text">Step Navigation</h2>
                  <div className="text-sm text-textSecondary">
                    {currentStep + 1} / {executionSteps.length}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep <= 0}
                    className="flex-1 bg-black/50 hover:bg-black/70 disabled:bg-gray-800 disabled:cursor-not-allowed text-text font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Prev
                  </button>
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    disabled={currentStep >= executionSteps.length - 1}
                    className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isAutoPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isAutoPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentStep >= executionSteps.length - 1}
                    className="flex-1 bg-black/50 hover:bg-black/70 disabled:bg-gray-800 disabled:cursor-not-allowed text-text font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Auto-play Speed */}
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Auto-play Speed: {autoPlaySpeed}ms
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="500"
                    value={autoPlaySpeed}
                    onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Explanation Panel */}
            <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-text">Explanation</h2>
              </div>
              
              {currentState ? (
                <div className="space-y-4">
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-xs text-textSecondary mb-1">Line {currentState.lineNumber}</div>
                    <code className="text-sm text-primary font-mono block mb-2">
                      {currentState.code}
                    </code>
                  </div>
                  <div className="text-textSecondary leading-relaxed">
                    {currentState.explanation}
                  </div>
                  
                  {/* Operation Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-textSecondary">Operation:</span>
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">
                      {currentState.operation}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-textSecondary/50 italic">
                  <p className="mb-2">No execution yet</p>
                  <p className="text-sm">Run the simulation to see step-by-step explanations</p>
                </div>
              )}
            </div>

            {/* Key Concepts */}
            <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
              <h3 className="text-lg font-bold text-text mb-3">Key Concepts</h3>
              <div className="space-y-2 text-sm text-textSecondary">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <strong className="text-text">Immutable Types:</strong> int, float, str, bool, tuple, None
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <strong className="text-text">Mutable Types:</strong> list, dict, set
                  </div>
                </div>
                <div className="pt-2 border-t border-primary/20">
                  <p className="text-xs">
                    Variables store references to objects. Multiple variables can reference the same object.
                    Mutations affect all references to mutable objects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

