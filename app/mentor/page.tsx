'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { generateGeminiResponse } from '@/lib/utils/gemini';
import { useAuth } from '@/contexts/AuthContext';

// Dynamically import DashboardLayout to avoid SSR issues
const DashboardLayout = dynamic(
  () => import('@/components/layout/DashboardLayout').then((mod) => ({ default: mod.DashboardLayout })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    )
  }
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ApiKey {
  id: string;
  name: string;
  service: string;
  key: string;
  createdAt: string;
}

export default function MentorPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Engineering Mentor. I'm here to help you with:\n\n📚 **Course Content**: Questions about AI/ML concepts, AI Engineering topics, and course modules\n💻 **Code Help**: Code explanations, debugging, best practices, and implementation guidance\n❓ **FAQs**: Common questions about AI Engineering, machine learning, deep learning, and GenAI\n🎓 **Learning Support**: Study tips, learning paths, and understanding complex topics\n\nI can answer anything related to AI Engineering, Machine Learning, Deep Learning, Generative AI, and this learning platform!\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Gemini API key from API Integration tab
  useEffect(() => {
    const loadApiKey = () => {
      if (typeof window === 'undefined') return;
      
      console.log('🔍 Loading API key... User UID:', user?.uid || 'not logged in');
      
      // Try with user ID first
      if (user?.uid) {
        const storageKey = `apiKeys_${user.uid}`;
        console.log('🔍 Checking localStorage key:', storageKey);
        const savedKeys = localStorage.getItem(storageKey);
        if (savedKeys) {
          try {
            const apiKeys: ApiKey[] = JSON.parse(savedKeys);
            console.log('📦 Found API keys:', apiKeys.length, apiKeys.map(k => ({ name: k.name, service: k.service })));
            // Find Gemini API key (look for service containing "gemini" or "google")
            const geminiKey = apiKeys.find(
              key => key.service.toLowerCase().includes('gemini') || 
                     key.service.toLowerCase().includes('google')
            );
            if (geminiKey) {
              console.log('✅ Found Gemini API key:', geminiKey.name, geminiKey.service, 'Key:', geminiKey.key.substring(0, 15) + '...');
              setGeminiApiKey(geminiKey.key);
              return;
            } else {
              console.log('❌ No Gemini/Google service found. Available services:', apiKeys.map(k => k.service));
            }
          } catch (e) {
            console.error('❌ Error parsing API keys:', e);
          }
        } else {
          console.log('❌ No API keys found in localStorage for key:', storageKey);
        }
      } else {
        console.log('⚠️ User not logged in, trying fallback search...');
      }
      
      // Fallback: try to find any API key with "gemini" or "google" in service name
      // Check all localStorage keys that might contain API keys
      try {
        console.log('🔍 Searching all localStorage keys...');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('apiKeys_')) {
            try {
              const apiKeys: ApiKey[] = JSON.parse(localStorage.getItem(key) || '[]');
              console.log(`📦 Checking ${key}:`, apiKeys.length, 'keys');
              const geminiKey = apiKeys.find(
                k => k.service.toLowerCase().includes('gemini') || 
                     k.service.toLowerCase().includes('google')
              );
              if (geminiKey) {
                console.log('✅ Found Gemini API key in fallback:', geminiKey.name, geminiKey.service);
                setGeminiApiKey(geminiKey.key);
                return;
              }
            } catch (e) {
              console.error('❌ Error parsing', key, ':', e);
            }
          }
        }
      } catch (e) {
        console.error('❌ Error in fallback API key search:', e);
      }
      
      console.log('❌ No Gemini API key found in any localStorage location');
      setGeminiApiKey(null);
    };

    loadApiKey();
  }, [user]);

  // Listen for storage changes and focus events (when API key is added)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        // Check all possible apiKeys_* keys
        if (e.key && e.key.startsWith('apiKeys_')) {
          console.log('🔄 Storage changed:', e.key);
          const savedKeys = localStorage.getItem(e.key);
          if (savedKeys) {
            try {
              const apiKeys: ApiKey[] = JSON.parse(savedKeys);
              const geminiKey = apiKeys.find(
                key => key.service.toLowerCase().includes('gemini') || 
                       key.service.toLowerCase().includes('google')
              );
              if (geminiKey) {
                console.log('✅ Reloaded Gemini API key from storage event');
                setGeminiApiKey(geminiKey.key);
              } else {
                setGeminiApiKey(null);
              }
            } catch (e) {
              console.error('Error reloading API keys:', e);
            }
          }
        }
      };

      const handleFocus = () => {
        // Reload API key when window regains focus (in case it was added in another tab)
        console.log('🔄 Window focused, reloading API keys...');
        if (user?.uid) {
          const savedKeys = localStorage.getItem(`apiKeys_${user.uid}`);
          if (savedKeys) {
            try {
              const apiKeys: ApiKey[] = JSON.parse(savedKeys);
              const geminiKey = apiKeys.find(
                key => key.service.toLowerCase().includes('gemini') || 
                       key.service.toLowerCase().includes('google')
              );
              if (geminiKey) {
                console.log('✅ Reloaded Gemini API key on focus');
                setGeminiApiKey(geminiKey.key);
                return;
              }
            } catch (e) {
              console.error('Error reloading API keys on focus:', e);
            }
          }
        }
        // Also try fallback search
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('apiKeys_')) {
            try {
              const apiKeys: ApiKey[] = JSON.parse(localStorage.getItem(key) || '[]');
              const geminiKey = apiKeys.find(
                k => k.service.toLowerCase().includes('gemini') || 
                     k.service.toLowerCase().includes('google')
              );
              if (geminiKey) {
                console.log('✅ Reloaded Gemini API key on focus (fallback)');
                setGeminiApiKey(geminiKey.key);
                return;
              }
            } catch (e) {
              // Skip
            }
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleFocus);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (mounted) {
      scrollToBottom();
    }
  }, [messages, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Build conversation history from previous messages (before adding current user message)
    const previousMessages = messages.filter(msg => msg.id !== '1'); // Exclude initial greeting
    const conversationHistory = previousMessages
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.content }]
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = `You are an expert AI Engineering Mentor for the AXEN AI Engineering Learning Platform. Your role is to help students learn and master AI/ML concepts, AI Engineering, and related technologies.

**Your Expertise Includes:**
- Artificial Intelligence (AI) fundamentals and advanced concepts
- Machine Learning (ML) algorithms, models, and techniques
- Deep Learning (DL) architectures, neural networks, and frameworks
- Generative AI (GenAI) including LLMs, transformers, and applications
- AI Engineering best practices, MLOps, and production deployment
- Python programming for AI/ML
- Data science and data engineering
- Course content from the AXEN platform

**Your Capabilities:**
1. **Course Content Questions**: Answer questions about AI/ML topics, course modules, lessons, and learning materials
2. **Code Help**: Provide code explanations, debugging assistance, best practices, and implementation examples
3. **FAQs**: Answer frequently asked questions about AI Engineering, ML, DL, GenAI, and the platform
4. **Learning Support**: Guide students through learning paths, explain complex concepts, and provide study tips
5. **General AI/ML Questions**: Answer any questions related to AI Engineering, machine learning, deep learning, or generative AI

**Response Guidelines:**
- Provide clear, accurate, and helpful explanations
- Include code examples when relevant (use proper formatting)
- Be encouraging, supportive, and patient
- Break down complex topics into understandable parts
- Reference real-world applications and use cases
- If asked about specific course content, provide detailed explanations
- For code questions, provide working examples and explain the logic
- Keep responses informative but concise when possible
- Use markdown formatting for better readability (code blocks, lists, bold text)

**Course Topics You Can Help With:**
- Introduction to AI and ML
- Supervised and Unsupervised Learning
- Neural Networks and Deep Learning
- Natural Language Processing (NLP)
- Computer Vision
- Reinforcement Learning
- Generative AI and LLMs
- MLOps and Model Deployment
- Data Preprocessing and Feature Engineering
- Model Evaluation and Optimization
- And any other AI/ML/AI Engineering topics

Remember: You are here to help students succeed in their AI Engineering journey. Be thorough, accurate, and supportive.`;

      // Check if API key is available - if not, try to reload it
      let apiKeyToUse = geminiApiKey;
      if (!apiKeyToUse) {
        console.log('⚠️ API key not in state, trying to reload from localStorage...');
        // Try to reload from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('apiKeys_')) {
            try {
              const apiKeys: ApiKey[] = JSON.parse(localStorage.getItem(key) || '[]');
              const geminiKey = apiKeys.find(
                k => k.service.toLowerCase().includes('gemini') || 
                     k.service.toLowerCase().includes('google')
              );
              if (geminiKey) {
                console.log('✅ Reloaded API key from localStorage:', geminiKey.name);
                apiKeyToUse = geminiKey.key;
                setGeminiApiKey(geminiKey.key); // Update state for next time
                break;
              }
            } catch (e) {
              // Skip
            }
          }
        }
      }

      if (!apiKeyToUse) {
        console.error('❌ Gemini API key not found in localStorage');
        throw new Error('Gemini API key not found. Please add your Gemini API key in the API Integration tab (service: Gemini or Google).');
      }

      console.log('🔑 Using API key:', apiKeyToUse.substring(0, 15) + '...', 'State key:', geminiApiKey ? 'set' : 'not set');
      const response = await generateGeminiResponse(input, context, conversationHistory, apiKeyToUse);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again or check your API configuration.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/g, '').replace(/```/g, '');
        return (
          <pre key={index} className="bg-card p-4 rounded-lg overflow-x-auto my-2">
            <code className="text-sm font-mono">{code}</code>
          </pre>
        );
      } else if (part.startsWith('`')) {
        const code = part.replace(/`/g, '');
        return (
          <code key={index} className="bg-card px-2 py-1 rounded text-sm font-mono">
            {code}
          </code>
        );
      } else if (part.startsWith('**')) {
        const text = part.replace(/\*\*/g, '');
        return <strong key={index}>{text}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">AI Mentor</h1>
          <p className="text-textSecondary">Get personalized guidance and answers to your questions</p>
          {!geminiApiKey && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm text-yellow-400 font-medium mb-2">
                  ⚠️ Gemini API key required to use AI Mentor
                </p>
                <p className="text-sm text-yellow-300/80">
                  To use AI Mentor, you need to add your own Gemini API key. Go to the{' '}
                  <a href="/api-integration" className="underline hover:text-yellow-200 font-semibold">
                    API Integration
                  </a>{' '}
                  tab and add your Gemini API key (service name: "Gemini" or "Google").
                </p>
                <p className="text-xs text-yellow-300/60 mt-2">
                  Get your free API key from:{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
                    https://aistudio.google.com/app/apikey
                  </a>
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex flex-col h-[calc(100vh-200px)]">
          <div className="glass rounded-xl flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary'
                        : 'bg-card'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-card text-text'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {formatMessage(message.content)}
                    </div>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-card rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-card">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about AI Engineering..."
                  className="flex-1 px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                  disabled={loading}
                  style={{ color: 'var(--color-text)' }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

