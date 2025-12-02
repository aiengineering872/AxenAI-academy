'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Key, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKey {
  id: string;
  name: string;
  service: string;
  key: string;
  createdAt: string;
}


export default function ApiIntegrationPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', service: '', key: '' });

  useEffect(() => {
    // Load API keys from localStorage
    const savedKeys = localStorage.getItem(`apiKeys_${user?.uid}`);
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, [user]);

  const addApiKey = () => {
    if (newKey.name && newKey.service && newKey.key) {
      const apiKey: ApiKey = {
        id: Date.now().toString(),
        ...newKey,
        createdAt: new Date().toISOString(),
      };
      const updated = [...apiKeys, apiKey];
      setApiKeys(updated);
      localStorage.setItem(`apiKeys_${user?.uid}`, JSON.stringify(updated));
      setNewKey({ name: '', service: '', key: '' });
      setShowAddKey(false);
    }
  };

  const deleteApiKey = (id: string) => {
    const updated = apiKeys.filter((k) => k.id !== id);
    setApiKeys(updated);
    localStorage.setItem(`apiKeys_${user?.uid}`, JSON.stringify(updated));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2 flex items-center gap-3">
            <Key className="w-8 h-8 text-primary" />
            API Integration
          </h1>
          <p className="text-textSecondary">
            Add your own API keys to use AI features. For AI Mentor, add a Gemini API key (service: "Gemini" or "Google").
          </p>
          <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-textSecondary">
              <strong className="text-primary">Get your free Gemini API key:</strong>{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                https://aistudio.google.com/app/apikey
              </a>
            </p>
          </div>
        </motion.div>

        <div className="max-w-2xl">
          {/* API Keys Management */}
          <div>
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text">API Keys</h2>
                <button
                  onClick={() => setShowAddKey(!showAddKey)}
                  className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-all"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>

              {showAddKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-4 bg-card/50 rounded-lg space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Key Name"
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background text-text rounded"
                  />
                  <input
                    type="text"
                    placeholder="Service (e.g., Gemini, Google, OpenAI, Anthropic)"
                    value={newKey.service}
                    onChange={(e) => setNewKey({ ...newKey, service: e.target.value })}
                    className="w-full px-3 py-2 bg-background text-text rounded"
                  />
                  <p className="text-xs text-textSecondary">
                    💡 For AI Mentor: Use "Gemini" or "Google" as the service name
                  </p>
                  <input
                    type="password"
                    placeholder="API Key"
                    value={newKey.key}
                    onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                    className="w-full px-3 py-2 bg-background text-text rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addApiKey}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-all"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddKey(false);
                        setNewKey({ name: '', service: '', key: '' });
                      }}
                      className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {apiKeys.length === 0 ? (
                  <p className="text-textSecondary text-sm text-center py-4">
                    No API keys added yet
                  </p>
                ) : (
                  apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-3 bg-card/50 rounded-lg transition-all hover:bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-text">{key.name}</p>
                          <p className="text-xs text-textSecondary">{key.service}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this API key?')) {
                              deleteApiKey(key.id);
                            }
                          }}
                          className="p-1 hover:bg-card rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

