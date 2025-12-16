'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, BookOpen, Download, Copy, AlertTriangle, CheckCircle, 
  ChevronRight, ChevronLeft, RefreshCw, FileText, Image as ImageIcon,
  Lightbulb, HelpCircle
} from 'lucide-react';
import { generateMockResponse, generateVariations, compareResponses } from './utils/mockLLM';

interface PromptTemplate {
  id: string;
  category: string;
  name: string;
  prompt: string;
  rolePrompt: string;
  temperature: number;
  topP: number;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'writing-1',
    category: 'Writing',
    name: 'Essay Writing',
    prompt: 'Write a 500-word essay about the impact of artificial intelligence on modern society.',
    rolePrompt: 'You are an experienced academic writer with expertise in technology and society.',
    temperature: 0.7,
    topP: 0.9,
  },
  {
    id: 'coding-1',
    category: 'Coding',
    name: 'Python Function',
    prompt: 'Write a Python function that calculates the factorial of a number using recursion.',
    rolePrompt: 'You are a senior software engineer specializing in Python and clean code practices.',
    temperature: 0.3,
    topP: 0.8,
  },
  {
    id: 'teaching-1',
    category: 'Teaching',
    name: 'Concept Explanation',
    prompt: 'Explain how neural networks work in simple terms for beginners.',
    rolePrompt: 'You are a patient and knowledgeable tutor who explains complex concepts clearly.',
    temperature: 0.5,
    topP: 0.85,
  },
  {
    id: 'translation-1',
    category: 'Translation',
    name: 'Language Translation',
    prompt: 'Translate the following text to Spanish: "Hello, how are you today?"',
    rolePrompt: 'You are a professional translator with native-level proficiency in multiple languages.',
    temperature: 0.2,
    topP: 0.7,
  },
  {
    id: 'summarization-1',
    category: 'Summarization',
    name: 'Text Summary',
    prompt: 'Summarize the key points from a long article about climate change.',
    rolePrompt: 'You are an expert at distilling complex information into clear, concise summaries.',
    temperature: 0.4,
    topP: 0.75,
  },
];

const LESSONS = [
  {
    id: 1,
    title: 'Understanding Role Prompts',
    description: 'Learn how role prompts shape AI responses',
    content: `Role prompts set the context and personality of the AI. For example:

• "You are a helpful tutor" → Friendly, educational tone
• "You are a senior engineer" → Technical, precise language
• "You are a creative writer" → More expressive, varied responses

Try changing the role prompt and see how the output changes!`,
    examplePrompt: 'Explain machine learning',
    exampleRole: 'You are a helpful tutor',
  },
  {
    id: 2,
    title: 'Temperature Explained',
    description: 'How temperature affects randomness and creativity',
    content: `Temperature controls randomness in responses:

• Low (0.0-0.5): Predictable, focused, conservative
• Medium (0.5-1.0): Balanced creativity and consistency  
• High (1.0-2.0): Creative, varied, sometimes unpredictable

Higher temperature = more synonyms, varied phrasing, creative variations.`,
    examplePrompt: 'Describe a sunset',
    exampleRole: 'You are a creative writer',
  },
  {
    id: 3,
    title: 'Top-P Sampling',
    description: 'Understanding nucleus sampling',
    content: `Top-P (nucleus sampling) controls diversity:

• Low (0.0-0.5): More deterministic, focused responses
• Medium (0.5-0.8): Balanced diversity
• High (0.8-1.0): More diverse word choices

Top-P works with temperature to control output variety.`,
    examplePrompt: 'Write a short story',
    exampleRole: 'You are a creative writer',
  },
  {
    id: 4,
    title: 'Writing Clear Prompts',
    description: 'Best practices for effective prompts',
    content: `Good prompts are:
• Specific: Clear instructions
• Contextual: Provide necessary background
• Structured: Use formatting when needed
• Constrained: Set boundaries and requirements

Avoid vague requests like "write something good" - be specific!`,
    examplePrompt: 'Write a 200-word product review for a smartphone',
    exampleRole: 'You are a tech reviewer',
  },
];

export default function PromptEngineeringSimulator() {
  const [basePrompt, setBasePrompt] = useState('');
  const [rolePrompt, setRolePrompt] = useState('You are a helpful assistant.');
  const [useRolePrompt, setUseRolePrompt] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [output, setOutput] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [outputA, setOutputA] = useState('');
  const [outputB, setOutputB] = useState('');
  const [variations, setVariations] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showLessons, setShowLessons] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [debugWarnings, setDebugWarnings] = useState<Array<{ type: 'warning' | 'error', message: string, suggestion: string }>>([]);

  // Generate output when parameters change
  useEffect(() => {
    if (basePrompt.trim() || compareMode) {
      if (compareMode) {
        if (promptA.trim()) {
          const responseA = generateMockResponse({
            basePrompt: promptA,
            rolePrompt: useRolePrompt ? rolePrompt : undefined,
            temperature,
            topP,
          });
          setOutputA(responseA);
        }
        if (promptB.trim()) {
          const responseB = generateMockResponse({
            basePrompt: promptB,
            rolePrompt: useRolePrompt ? rolePrompt : undefined,
            temperature,
            topP,
          });
          setOutputB(responseB);
        }
      } else {
        const response = generateMockResponse({
          basePrompt,
          rolePrompt: useRolePrompt ? rolePrompt : undefined,
          temperature,
          topP,
        });
        setOutput(response);
      }
    }
  }, [basePrompt, rolePrompt, useRolePrompt, temperature, topP, compareMode, promptA, promptB]);

  // Debug prompt
  useEffect(() => {
    const warnings: Array<{ type: 'warning' | 'error', message: string, suggestion: string }> = [];
    const prompt = compareMode ? promptA : basePrompt;
    
    if (prompt.length < 10) {
      warnings.push({
        type: 'error',
        message: 'Prompt is too short',
        suggestion: 'Add more details to get better results',
      });
    }
    
    if (prompt.length > 500) {
      warnings.push({
        type: 'warning',
        message: 'Prompt is very long',
        suggestion: 'Consider breaking it into smaller, focused requests',
      });
    }
    
    const vagueWords = ['something', 'good', 'nice', 'better', 'stuff'];
    const hasVagueWords = vagueWords.some(word => prompt.toLowerCase().includes(word));
    if (hasVagueWords) {
      warnings.push({
        type: 'warning',
        message: 'Prompt contains vague words',
        suggestion: 'Be more specific about what you want',
      });
    }
    
    if (!prompt.includes('?') && !prompt.includes('write') && !prompt.includes('explain') && !prompt.includes('create')) {
      warnings.push({
        type: 'warning',
        message: 'Missing clear instruction',
        suggestion: 'Start with an action verb like "write", "explain", or "create"',
      });
    }
    
    if (prompt.split(' ').length < 5) {
      warnings.push({
        type: 'warning',
        message: 'Prompt lacks context',
        suggestion: 'Add more context to help generate better responses',
      });
    }
    
    setDebugWarnings(warnings);
  }, [basePrompt, promptA, compareMode]);

  // Load template
  const loadTemplate = (template: PromptTemplate) => {
    setBasePrompt(template.prompt);
    setRolePrompt(template.rolePrompt);
    setTemperature(template.temperature);
    setTopP(template.topP);
    setUseRolePrompt(true);
    setSelectedTemplate(template.id);
    setCompareMode(false);
  };

  // Generate variations
  const handleGenerateVariations = () => {
    const vars = generateVariations({
      basePrompt: compareMode ? promptA : basePrompt,
      rolePrompt: useRolePrompt ? rolePrompt : undefined,
      temperature,
      topP,
    }, 5);
    setVariations(vars);
    setShowVariations(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Export as text
  const exportAsText = () => {
    const content = compareMode
      ? `Prompt A: ${promptA}\n\nOutput A:\n${outputA}\n\n---\n\nPrompt B: ${promptB}\n\nOutput B:\n${outputB}`
      : `Prompt: ${basePrompt}\n\nRole: ${rolePrompt}\n\nTemperature: ${temperature}\nTop-P: ${topP}\n\nOutput:\n${output}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'prompt-engineering-output.txt';
    link.href = url;
    link.click();
  };

  // Load lesson
  const loadLesson = (lesson: typeof LESSONS[0]) => {
    setBasePrompt(lesson.examplePrompt);
    setRolePrompt(lesson.exampleRole);
    setSelectedLesson(lesson.id);
    setShowLessons(false);
    setCompareMode(false);
  };

  const comparison = outputA && outputB ? compareResponses(outputA, outputB) : null;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-text">Prompt Engineering Sandbox</h1>
          <p className="text-textSecondary">Experiment with prompts and see how parameters affect outputs (Frontend-only simulator)</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-4 mb-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowLessons(!showLessons)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors text-white"
          >
            <BookOpen size={18} />
            <span>Lessons</span>
          </button>
          
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              compareMode
                ? 'bg-primary hover:bg-primary/80 text-white'
                : 'bg-card/50 hover:bg-card/70 text-text'
            }`}
          >
            <FileText size={18} />
            <span>Compare Mode</span>
          </button>
          
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={exportAsText}
              className="flex items-center gap-2 px-4 py-2 bg-card/50 hover:bg-card/70 rounded-lg transition-colors text-text"
            >
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Lessons Panel */}
        <AnimatePresence>
          {showLessons && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6 mb-6 overflow-hidden"
            >
              <h3 className="text-xl font-bold mb-4 text-text">Learning Lessons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LESSONS.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => loadLesson(lesson)}
                    className={`p-4 bg-black/50 hover:bg-black/70 rounded-lg text-left border transition-all ${
                      selectedLesson === lesson.id ? 'border-primary' : 'border-primary/20'
                    }`}
                  >
                    <h4 className="font-semibold text-text mb-1">{lesson.title}</h4>
                    <p className="text-sm text-textSecondary mb-2">{lesson.description}</p>
                    <p className="text-xs text-textSecondary whitespace-pre-line">{lesson.content}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Selector */}
        <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-4 mb-6">
          <label className="block text-sm font-semibold text-textSecondary mb-2">Quick Templates</label>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              const template = PROMPT_TEMPLATES.find(t => t.id === e.target.value);
              if (template) loadTemplate(template);
            }}
            className="w-full bg-black/50 border border-primary/20 rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
          >
            <option value="">Select a template...</option>
            {PROMPT_TEMPLATES.map(template => (
              <option key={template.id} value={template.id}>
                {template.category}: {template.name}
              </option>
            ))}
          </select>
        </div>

        {!compareMode ? (
          <>
            {/* Single Prompt Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Input Panel */}
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 text-text">Prompt Input</h2>
                
                {/* Role Prompt */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-textSecondary">Role Prompt</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useRolePrompt}
                        onChange={(e) => setUseRolePrompt(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-textSecondary">Enable</span>
                    </label>
                  </div>
                  <textarea
                    value={rolePrompt}
                    onChange={(e) => setRolePrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="w-full bg-black/50 border border-primary/20 rounded-lg p-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary min-h-[80px] text-sm"
                  />
                </div>
                
                {/* Base Prompt */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Main Prompt
                  </label>
                  <textarea
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full bg-black/50 border border-primary/20 rounded-lg p-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary min-h-[150px]"
                  />
                  <div className="flex justify-between mt-2 text-xs text-textSecondary">
                    <span>{basePrompt.split(' ').length} words</span>
                    <span>{basePrompt.length} characters</span>
                  </div>
                </div>
                
                {/* Parameters */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-textSecondary">Temperature: {temperature.toFixed(2)}</label>
                      <span title="Controls randomness and creativity">
                        <HelpCircle size={14} className="text-textSecondary" aria-label="Controls randomness and creativity" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-textSecondary mt-1">
                      <span>Conservative</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-textSecondary">Top-P: {topP.toFixed(2)}</label>
                      <span title="Controls diversity of word choices">
                        <HelpCircle size={14} className="text-textSecondary" aria-label="Controls diversity of word choices" />
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={topP}
                      onChange={(e) => setTopP(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-textSecondary mt-1">
                      <span>Focused</span>
                      <span>Diverse</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Output Panel */}
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-text">Mock AI Output</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(output)}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-text"
                      title="Copy to clipboard"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={handleGenerateVariations}
                      className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors text-sm text-white"
                    >
                      Generate 5 Variations
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/50 rounded-lg p-4 min-h-[400px] border border-primary/20">
                  {output ? (
                    <p className="text-textSecondary leading-relaxed whitespace-pre-wrap">{output}</p>
                  ) : (
                    <p className="text-textSecondary/50 italic">Enter a prompt to see the mock AI response...</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Variations Grid */}
            <AnimatePresence>
              {showVariations && variations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6 mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text">Output Variations</h3>
                    <button
                      onClick={() => setShowVariations(false)}
                      className="text-textSecondary hover:text-text"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variations.map((variation, i) => (
                      <div key={i} className="bg-black/50 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-textSecondary">Variation {i + 1}</span>
                          <button
                            onClick={() => copyToClipboard(variation)}
                            className="text-textSecondary hover:text-text"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-textSecondary">{variation}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Compare Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 text-text">Prompt A</h2>
                <textarea
                  value={promptA}
                  onChange={(e) => setPromptA(e.target.value)}
                  placeholder="Enter first prompt..."
                  className="w-full bg-black/50 border border-primary/20 rounded-lg p-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary min-h-[100px] mb-4"
                />
                <div className="bg-black/50 rounded-lg p-4 min-h-[200px] border border-primary/20">
                  {outputA ? (
                    <p className="text-textSecondary leading-relaxed whitespace-pre-wrap">{outputA}</p>
                  ) : (
                    <p className="text-textSecondary/50 italic">Enter prompt A...</p>
                  )}
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 text-text">Prompt B</h2>
                <textarea
                  value={promptB}
                  onChange={(e) => setPromptB(e.target.value)}
                  placeholder="Enter second prompt..."
                  className="w-full bg-black/50 border border-primary/20 rounded-lg p-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary min-h-[100px] mb-4"
                />
                <div className="bg-black/50 rounded-lg p-4 min-h-[200px] border border-primary/20">
                  {outputB ? (
                    <p className="text-textSecondary leading-relaxed whitespace-pre-wrap">{outputB}</p>
                  ) : (
                    <p className="text-textSecondary/50 italic">Enter prompt B...</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Comparison Stats */}
            {comparison && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-text">Comparison Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm text-textSecondary mb-1">Similarity</div>
                    <div className="text-2xl font-bold text-primary">
                      {(comparison.similarity * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm text-textSecondary mb-1">Words Only in A</div>
                    <div className="text-lg font-semibold text-red-400">
                      {comparison.differences.filter(d => d.type === 'removed').length}
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm text-textSecondary mb-1">Words Only in B</div>
                    <div className="text-lg font-semibold text-green-400">
                      {comparison.differences.filter(d => d.type === 'added').length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Debugger Panel */}
        {debugWarnings.length > 0 && (
          <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-400" size={20} />
              <h3 className="text-xl font-bold text-text">Prompt Debugger</h3>
            </div>
            <div className="space-y-3">
              {debugWarnings.map((warning, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    warning.type === 'error'
                      ? 'bg-red-900/20 border-red-500/50'
                      : 'bg-yellow-900/20 border-yellow-500/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {warning.type === 'error' ? (
                      <AlertTriangle className="text-red-400 mt-0.5" size={18} />
                    ) : (
                      <AlertTriangle className="text-yellow-400 mt-0.5" size={18} />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-text mb-1">{warning.message}</div>
                      <div className="text-sm text-textSecondary">{warning.suggestion}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


