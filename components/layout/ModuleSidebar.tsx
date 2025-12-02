'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Circle, Menu, X, ChevronRight } from 'lucide-react';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { useRouter } from 'next/navigation';


interface Module {
  id: string;
  number: string;
  name: string;
  order: number;
  topics: Array<{
    id: string;
    name: string;
    content: string;
    order: number;
  }>;
}

interface ModuleSidebarProps {
  moduleId: string;
  courseId: string;
  currentLessonIndex: number;
  onLessonClick: (index: number) => void;
  moduleTitle?: string;
  modules?: Module[];
  selectedModuleIndex?: number | null;
  onModuleSelect?: (index: number) => void;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  moduleId,
  courseId,
  currentLessonIndex,
  onLessonClick,
  moduleTitle,
  modules: propModules = [],
  selectedModuleIndex = null,
  onModuleSelect,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Debug: Log modules received
  React.useEffect(() => {
    console.log('ModuleSidebar - Received modules:', propModules);
    console.log('ModuleSidebar - Modules count:', propModules.length);
    console.log('ModuleSidebar - Modules array:', Array.isArray(propModules));
  }, [propModules]);

  // Auto-expand selected module and ensure it stays expanded
  useEffect(() => {
    if (selectedModuleIndex !== null && propModules[selectedModuleIndex]) {
      const selectedModuleId = propModules[selectedModuleIndex].id;
      setExpandedModules((prev) => {
        const newSet = new Set(prev);
        newSet.add(selectedModuleId);
        return newSet;
      });
    }
  }, [selectedModuleIndex, propModules]);

  const handleModuleClick = (moduleIndex: number) => {
    const module = propModules[moduleIndex];
    if (!module) return;
    
    // Toggle expand/collapse
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module.id)) {
        newSet.delete(module.id);
      } else {
        newSet.add(module.id);
      }
      return newSet;
    });
    
    // Select the module
    if (onModuleSelect) {
      onModuleSelect(moduleIndex);
    }
    
    setIsMobileOpen(false);
  };

  const handleTopicClick = (moduleIndex: number, topicIndex: number) => {
    // If clicking a topic from a different module, select that module first
    if (onModuleSelect && moduleIndex !== selectedModuleIndex) {
      onModuleSelect(moduleIndex);
      // After module is selected, topics will be loaded
      // Use a small delay to ensure topics are loaded before clicking
      setTimeout(() => {
        onLessonClick(topicIndex);
      }, 100);
    } else {
      // Module is already selected, topics should be loaded, click the topic
      onLessonClick(topicIndex);
    }
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-card/50">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-textSecondary uppercase tracking-widest">Current subject</p>
            <h3 className="font-semibold text-text text-sm">
              {moduleTitle || 'Subject Overview'}
            </h3>
          </div>
        </div>
        <p className="text-xs text-textSecondary">
          {propModules.length} {propModules.length === 1 ? 'module' : 'modules'}
        </p>
      </div>

      <nav className="p-2 space-y-2 overflow-y-auto flex-1 bg-background/40">
        {propModules.length === 0 ? (
          <div className="p-4 text-center text-textSecondary text-sm">
            No modules available
          </div>
        ) : (
          propModules
            .sort((a, b) => a.order - b.order)
            .map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id);
              const isSelected = selectedModuleIndex === moduleIndex;
              const sortedTopics = [...module.topics].sort((a, b) => a.order - b.order);
              
              return (
                <div
                  key={module.id}
                  className={`rounded-xl border transition ${
                    isSelected
                      ? 'border-primary/60 bg-primary/10 shadow-[0_0_12px_rgba(255,99,64,0.2)]'
                      : 'border-card/40 bg-background/60 hover:border-card/60'
                  }`}
                >
                  <button
                    onClick={() => handleModuleClick(moduleIndex)}
                    className="w-full flex items-center justify-between px-3 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {module.number ? `Module ${module.number}` : `Module ${moduleIndex + 1}`}
                        {module.name && module.name.trim() ? ` - ${module.name}` : ''}
                      </p>
                      <p className="text-xs text-textSecondary">
                        {sortedTopics.length}{' '}
                        {sortedTopics.length === 1 ? 'topic' : 'topics'}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-textSecondary transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-primary' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-card/40">
                      {sortedTopics.length === 0 ? (
                        <p className="p-4 text-center text-xs text-textSecondary">
                          No topics available
                        </p>
                      ) : (
                        sortedTopics.map((topic, topicIndex) => {
                          const isActiveTopic = isSelected && topicIndex === currentLessonIndex;
                          const topicCompleted = learningProgressService.isLessonCompleted(
                            courseId,
                            moduleId,
                            `${module.id}-${topic.id}`
                          );
                          
                          return (
                            <motion.button
                              key={topic.id}
                              onClick={() => handleTopicClick(moduleIndex, topicIndex)}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.97 }}
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm transition-all ${
                                isActiveTopic
                                  ? 'bg-primary/20 text-primary shadow-glow'
                                  : topicCompleted
                                  ? 'text-textSecondary hover:text-text hover:bg-card/50'
                                  : 'text-textSecondary hover:text-text hover:bg-card/30'
                              }`}
                            >
                              {topicCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="font-medium truncate flex-1">
                                {topicIndex + 1}. {topic.name}
                              </span>
                            </motion.button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card/80 backdrop-blur-sm border border-card rounded-lg text-text hover:bg-card transition-all"
        aria-label="Toggle lesson menu"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-shrink-0 flex-col w-64 bg-background/90 backdrop-blur-md border-r border-card/40 shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)] md:sticky md:top-0 md:h-screen md:max-h-screen md:overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="md:hidden flex flex-col w-64 min-h-screen bg-card border-r border-primary/20 fixed left-0 top-0 z-50"
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </>
  );
};

