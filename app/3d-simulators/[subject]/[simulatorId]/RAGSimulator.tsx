'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Search, Layers, ArrowRight, Download, Copy,
  ChevronRight, ChevronLeft, Settings, Info, Sparkles, Database
} from 'lucide-react';
import {
  chunkText,
  generateChunkEmbeddings,
  searchChunks,
  generateMockLLMResponse,
  buildContextPrompt,
  Chunk,
  SearchResult,
} from './utils/ragSimulator';

// Dynamic import for pdfjs-dist with Next.js compatibility
// Using a function that safely loads PDF.js without causing Object.defineProperty errors
const loadPdfJsSafely = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // Use a try-catch wrapper to prevent errors from propagating
    let pdfjsModule: any = null;
    
    // Wrap the import in a try-catch to handle module loading errors
    try {
      // Use dynamic import with error boundary
      const importPromise = import('pdfjs-dist');
      pdfjsModule = await Promise.resolve(importPromise).catch((err) => {
        console.warn('PDF.js import promise rejected:', err);
        return null;
      });
    } catch (importError: any) {
      // Silently catch import errors to prevent crashes
      console.warn('Failed to import pdfjs-dist module:', importError?.message || importError);
      return null;
    }
    
    if (!pdfjsModule || typeof pdfjsModule !== 'object') {
      return null;
    }
    
    // Handle different export formats safely with type checks
    let pdfjs: any = null;
    
    try {
      // Check if it's a default export
      if (pdfjsModule.default && typeof pdfjsModule.default === 'object') {
        const defaultExport = pdfjsModule.default;
        if (typeof defaultExport.getDocument === 'function') {
          pdfjs = defaultExport;
        }
      }
      
      // Check if the module itself has getDocument
      if (!pdfjs && typeof pdfjsModule.getDocument === 'function') {
        pdfjs = pdfjsModule;
      }
      
      // If still not found, search for getDocument in exports
      if (!pdfjs) {
        const exports = Object.values(pdfjsModule);
        for (const exp of exports) {
          if (exp && typeof exp === 'object' && typeof (exp as any).getDocument === 'function') {
            pdfjs = exp;
            break;
          }
        }
      }
    } catch (parseError) {
      console.warn('Error parsing PDF.js module:', parseError);
      return null;
    }
    
    if (!pdfjs || typeof pdfjs.getDocument !== 'function') {
      return null;
    }
    
    // Configure worker safely with error handling
    try {
      const workerVersion = String(pdfjs.version || '5.4.449');
      if (pdfjs.GlobalWorkerOptions && typeof pdfjs.GlobalWorkerOptions === 'object') {
        // Safely set worker source
        try {
          Object.defineProperty(pdfjs.GlobalWorkerOptions, 'workerSrc', {
            value: `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`,
            writable: true,
            configurable: true
          });
        } catch (defineError) {
          // Fallback: direct assignment
          (pdfjs.GlobalWorkerOptions as any).workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;
        }
      }
    } catch (workerError) {
      console.warn('Failed to configure PDF.js worker:', workerError);
      // Continue without worker configuration - PDF.js might still work
    }
    
    return pdfjs;
  } catch (error: any) {
    // Final error catch - prevent any errors from crashing the app
    console.error('Error loading PDF.js:', error?.message || error);
    return null;
  }
};

const EMBEDDING_DIMENSIONS = 16;

export default function RAGSimulator() {
  const [documentText, setDocumentText] = useState('');
  const [chunkSize, setChunkSize] = useState(50);
  const [overlap, setOverlap] = useState(10);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false);
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant that answers questions based on the provided context.');
  const [creativity, setCreativity] = useState(0.5);
  const [verbosity, setVerbosity] = useState(0.5);
  const [llmOutput, setLlmOutput] = useState('');
  const [contextPrompt, setContextPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showPipeline, setShowPipeline] = useState(true);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [pdfjsLoading, setPdfjsLoading] = useState(false);
  const [pdfjsError, setPdfjsError] = useState<string | null>(null);

  // Load PDF.js library on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !pdfjsLib && !pdfjsLoading && !pdfjsError) {
      setPdfjsLoading(true);
      setPdfjsError(null);
      
      loadPdfJsSafely()
        .then((pdfjs) => {
          if (pdfjs && typeof pdfjs.getDocument === 'function') {
            setPdfjsLib(pdfjs);
            setPdfjsLoading(false);
          } else {
            setPdfjsError('PDF.js library could not be loaded. Please use text files (.txt, .md) instead.');
            setPdfjsLoading(false);
          }
        })
        .catch((err: any) => {
          console.error('Failed to load pdfjs-dist:', err);
          setPdfjsError(err?.message || 'Failed to load PDF.js library');
          setPdfjsLoading(false);
        });
    }
  }, [pdfjsLib, pdfjsLoading, pdfjsError]);

  // Step definitions for pipeline
  const steps = [
    { id: 0, name: 'Document', icon: FileText },
    { id: 1, name: 'Chunking', icon: Layers },
    { id: 2, name: 'Embedding', icon: Database },
    { id: 3, name: 'Search', icon: Search },
    { id: 4, name: 'Context', icon: FileText },
    { id: 5, name: 'LLM Output', icon: Sparkles },
  ];

  // Chunk document when text or parameters change
  useEffect(() => {
    if (documentText.trim()) {
      const newChunks = chunkText(documentText, chunkSize, overlap);
      setChunks(newChunks);
      setEmbeddingsGenerated(false);
      setSearchResults([]);
      setLlmOutput('');
      setCurrentStep(1);
    } else {
      setChunks([]);
      setEmbeddingsGenerated(false);
      setSearchResults([]);
      setCurrentStep(0);
    }
  }, [documentText, chunkSize, overlap]);

  // Generate embeddings when chunks are ready
  useEffect(() => {
    if (chunks.length > 0 && !embeddingsGenerated) {
      const chunksWithEmbeddings = generateChunkEmbeddings(chunks, EMBEDDING_DIMENSIONS);
      setChunks(chunksWithEmbeddings);
      setEmbeddingsGenerated(true);
      setCurrentStep(2);
    }
  }, [chunks.length, embeddingsGenerated]);

  // Perform search when query changes
  useEffect(() => {
    if (query.trim() && chunks.length > 0 && embeddingsGenerated) {
      const results = searchChunks(query, chunks, topK);
      setSearchResults(results);
      setCurrentStep(3);
      
      // Generate LLM output if we have results
      if (results.length > 0) {
        const retrievedChunks = results.map(r => r.chunk);
        const output = generateMockLLMResponse(query, retrievedChunks, creativity, verbosity);
        setLlmOutput(output);
        setCurrentStep(5);
        
        // Build context prompt
        const context = buildContextPrompt(systemPrompt, retrievedChunks, query);
        setContextPrompt(context);
        setCurrentStep(4);
      } else {
        setLlmOutput('');
        setContextPrompt('');
      }
    } else {
      setSearchResults([]);
      setLlmOutput('');
      setContextPrompt('');
      if (embeddingsGenerated) {
        setCurrentStep(2);
      }
    }
  }, [query, chunks, embeddingsGenerated, topK, creativity, verbosity, systemPrompt]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    // Handle PDF files
    if (fileName.endsWith('.pdf')) {
      // Check if PDF.js is loading
      if (pdfjsLoading) {
        alert('PDF.js library is still loading. Please wait a moment and try again.');
        return;
      }

      // Check if PDF.js failed to load - try to reload
      if (pdfjsError || !pdfjsLib) {
        setPdfjsLoading(true);
        setPdfjsError(null);
        
        const pdfjs = await loadPdfJsSafely();
        if (pdfjs && typeof pdfjs.getDocument === 'function') {
          setPdfjsLib(pdfjs);
          setPdfjsLoading(false);
        } else {
          setPdfjsError('PDF.js library could not be loaded');
          setPdfjsLoading(false);
          alert('PDF.js library is not available. Please try uploading a text file (.txt or .md) instead, or refresh the page and try again.');
          return;
        }
      }

      // Now pdfjsLib should be available
      if (!pdfjsLib) {
        alert('PDF.js library is not available. Please try uploading a text file instead.');
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: 0, // Suppress console warnings
        });
        
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Extract text from text items
            const pageText = textContent.items
              .map((item: any) => {
                if (item && typeof item === 'object' && 'str' in item) {
                  return item.str;
                }
                return '';
              })
              .filter((text: string) => text.trim().length > 0)
              .join(' ');
            
            fullText += pageText + '\n\n';
          } catch (pageError) {
            console.warn(`Error extracting text from page ${i}:`, pageError);
            // Continue with other pages
          }
        }
        
        if (fullText.trim().length === 0) {
          throw new Error('No text could be extracted from the PDF. The PDF might be image-based or encrypted.');
        }
        
        setDocumentText(fullText.trim());
      } catch (error: any) {
        console.error('Error parsing PDF:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        alert(`Error reading PDF file: ${errorMessage}\n\nPlease make sure it's a valid PDF file or try a text file instead.`);
      }
    } else {
      // Handle text files (.txt, .md, etc.)
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDocumentText(text);
      };
      reader.onerror = () => {
        alert('Error reading text file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  // Get color for embedding value
  const getEmbeddingColor = (value: number) => {
    const intensity = Math.abs(value);
    if (value > 0) {
      return `rgba(220, 77, 1, ${intensity})`; // Orange for positive
    } else {
      return `rgba(59, 130, 246, ${intensity})`; // Blue for negative
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-text">RAG Pipeline Simulator</h1>
          <p className="text-textSecondary">Visualize how Retrieval-Augmented Generation works step-by-step (Frontend-only)</p>
        </div>

        {/* Pipeline Flow Visualization */}
        {showPipeline && (
          <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text">Pipeline Flow</h2>
              <button
                onClick={() => setShowPipeline(!showPipeline)}
                className="text-textSecondary hover:text-text"
              >
                ×
              </button>
            </div>
            <div className="flex items-center justify-between overflow-x-auto pb-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep >= step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isCurrent ? 1.1 : 1 }}
                      className={`flex flex-col items-center cursor-pointer ${
                        isActive ? 'text-primary' : 'text-textSecondary'
                      }`}
                      onClick={() => setCurrentStep(step.id)}
                    >
                      <div className={`p-4 rounded-lg border-2 mb-2 ${
                        isActive
                          ? 'border-primary bg-primary/10'
                          : 'border-primary/20 bg-black/50'
                      }`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-xs font-medium">{step.name}</span>
                    </motion.div>
                    {index < steps.length - 1 && (
                      <ChevronRight
                        className={`mx-2 ${isActive ? 'text-primary' : 'text-textSecondary'}`}
                        size={20}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input & Processing */}
          <div className="space-y-6">
            {/* Document Input */}
            <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-text">
                  <FileText size={24} />
                  Document Input
                </h2>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg cursor-pointer transition-colors text-text">
                    <Upload size={18} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".txt,.md,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={pdfjsLoading}
                    />
                  </label>
                  {pdfjsLoading && (
                    <span className="text-xs text-textSecondary">Loading PDF.js...</span>
                  )}
                  {pdfjsError && (
                    <span className="text-xs text-red-400">PDF.js unavailable</span>
                  )}
                </div>
              </div>
              
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your document text here or upload a file (TXT, MD, or PDF)..."
                className="w-full bg-black/50 border border-primary/20 rounded-lg p-4 text-text placeholder-textSecondary focus:outline-none focus:border-primary min-h-[200px]"
              />
              
              <div className="mt-4 flex justify-between text-sm text-textSecondary">
                <span>{documentText.split(/\s+/).length} words</span>
                <span>{documentText.length} characters</span>
              </div>
            </div>

            {/* Chunking Controls */}
            {documentText.trim() && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text">
                  <Layers size={24} />
                  Chunking
                </h2>
                
                <div className="space-y-4 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-textSecondary">Chunk Size: {chunkSize} words</label>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="10"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-textSecondary">Overlap: {overlap} words</label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.floor(chunkSize / 2)}
                      step="5"
                      value={overlap}
                      onChange={(e) => setOverlap(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Chunks Display */}
                {chunks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-textSecondary">{chunks.length} chunks created</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                      {chunks.map((chunk) => (
                        <motion.button
                          key={chunk.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedChunk(chunk)}
                          className={`p-3 bg-black/50 hover:bg-black/70 rounded-lg border text-left transition-all ${
                            selectedChunk?.id === chunk.id
                              ? 'border-primary'
                              : 'border-primary/20'
                          }`}
                        >
                          <div className="text-xs text-textSecondary mb-1">Chunk {chunk.id + 1}</div>
                          <div className="text-sm text-text line-clamp-2">
                            {chunk.text.substring(0, 50)}...
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Embeddings Visualization */}
            {embeddingsGenerated && chunks.length > 0 && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text">
                  <Database size={24} />
                  Embeddings ({EMBEDDING_DIMENSIONS}D)
                </h2>
                <p className="text-sm text-textSecondary mb-4">
                  Simulated embeddings for each chunk (deterministic hash-based)
                </p>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {chunks.slice(0, 5).map((chunk) => (
                    <div key={chunk.id} className="bg-black/50 rounded-lg p-4 border border-primary/20">
                      <div className="text-sm font-semibold text-text mb-2">Chunk {chunk.id + 1}</div>
                      <div className="grid grid-cols-8 gap-1">
                        {chunk.embedding.map((value, i) => (
                          <div
                            key={i}
                            className="h-6 rounded border border-primary/20"
                            style={{ backgroundColor: getEmbeddingColor(value) }}
                            title={`${value.toFixed(3)}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {chunks.length > 5 && (
                    <div className="text-sm text-textSecondary text-center">
                      ... and {chunks.length - 5} more chunks
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vector Search */}
            {embeddingsGenerated && chunks.length > 0 && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text">
                  <Search size={24} />
                  Vector Search
                </h2>
                
                <div className="mb-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your query..."
                    className="w-full bg-black/50 border border-primary/20 rounded-lg p-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Top-K: {topK}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={Math.min(10, chunks.length)}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text">Retrieved Chunks (Ranked by Similarity)</h3>
                    {searchResults.map((result) => (
                      <motion.div
                        key={result.chunk.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/50 rounded-lg p-4 border border-primary/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-primary text-white rounded text-xs font-bold">
                              Rank {result.rank}
                            </span>
                            <span className="text-sm text-textSecondary">
                              Similarity: {(result.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-textSecondary">{result.chunk.text}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Context & Output */}
          <div className="space-y-6">
            {/* Context Injection */}
            {searchResults.length > 0 && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-text">Context Injection</h2>
                  <button
                    onClick={() => copyToClipboard(contextPrompt)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-text"
                    title="Copy prompt"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm font-semibold text-primary mb-2">SYSTEM:</div>
                    <input
                      type="text"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full bg-black/30 border border-primary/20 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm font-semibold text-primary mb-2">CONTEXT:</div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {searchResults.map((result, i) => (
                        <div key={i} className="bg-black/30 rounded p-2 text-sm text-textSecondary">
                          <span className="text-primary font-semibold">[Chunk {result.rank}]</span> {result.chunk.text}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-black/50 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm font-semibold text-primary mb-2">USER:</div>
                    <div className="text-text">{query}</div>
                  </div>
                </div>
              </div>
            )}

            {/* LLM Output Controls */}
            {searchResults.length > 0 && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4 text-text">LLM Parameters</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Creativity: {creativity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={creativity}
                      onChange={(e) => setCreativity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Verbosity: {verbosity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={verbosity}
                      onChange={(e) => setVerbosity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mock LLM Output */}
            {llmOutput && (
              <div className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-text">
                    <Sparkles size={24} />
                    Mock LLM Output
                  </h2>
                  <button
                    onClick={() => copyToClipboard(llmOutput)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-text"
                    title="Copy output"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                
                <div className="bg-black/50 rounded-lg p-4 min-h-[200px] border border-primary/20">
                  <p className="text-textSecondary leading-relaxed whitespace-pre-wrap">{llmOutput}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Chunk Modal */}
        <AnimatePresence>
          {selectedChunk && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedChunk(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-card/50 backdrop-blur rounded-lg border border-primary/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-text">Chunk {selectedChunk.id + 1}</h3>
                  <button
                    onClick={() => setSelectedChunk(null)}
                    className="text-textSecondary hover:text-text"
                  >
                    ×
                  </button>
                </div>
                <p className="text-textSecondary">{selectedChunk.text}</p>
                {selectedChunk.embedding.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-textSecondary mb-2">Embedding Visualization</div>
                    <div className="grid grid-cols-8 gap-1">
                      {selectedChunk.embedding.map((value, i) => (
                        <div
                          key={i}
                          className="h-8 rounded border border-primary/20"
                          style={{ backgroundColor: getEmbeddingColor(value) }}
                          title={`${value.toFixed(3)}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

