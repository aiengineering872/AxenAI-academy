'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subject?: any;
  courses: any[];
  preselectedCourseId?: string;
}

interface Topic {
  id: string;
  name: string;
  content: string;
  order: number;
}

interface Module {
  id: string;
  number: string;
  name: string;
  order: number;
  topics: Topic[];
}

const defaultForm = {
  title: '',
  description: '',
  duration: '',
  difficulty: 'beginner',
  courseId: '',
  order: 0,
};

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subject,
  courses,
  preselectedCourseId,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const isEditMode = Boolean(subject);
  const hasCourses = courses.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setModules([]);
      setExpandedModules(new Set());
      setLoading(false);
      return;
    }

    if (subject) {
      setFormData({
        title: subject.title ?? '',
        description: subject.description ?? '',
        duration: subject.duration ?? '',
        difficulty: subject.difficulty ?? 'beginner',
        courseId: subject.courseId ?? preselectedCourseId ?? courses[0]?.id ?? '',
        order: subject.order ?? 0,
      });
      
      // Load modules if they exist
      if (subject.modules && Array.isArray(subject.modules)) {
        const loadedModules = subject.modules.map((m: any, index: number) => ({
          id: m.id || `module-${Date.now()}-${index}`,
          number: m.number || '',
          name: m.name || '',
          order: m.order ?? index,
          topics: (m.topics || []).map((t: any, topicIndex: number) => ({
            id: t.id || `topic-${Date.now()}-${index}-${topicIndex}`,
            name: t.name || '',
            content: t.content || '',
            order: t.order ?? topicIndex,
          })),
        }));
        setModules(loadedModules);
        // Expand all modules by default
        setExpandedModules(new Set(loadedModules.map((m: Module) => m.id)));
      } else {
        setModules([]);
      }
    } else {
      setFormData({
        ...defaultForm,
        courseId: preselectedCourseId ?? courses[0]?.id ?? '',
        order: 0,
      });
      setModules([]);
      setExpandedModules(new Set());
    }
  }, [isOpen, subject, courses, preselectedCourseId]);

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      number: '',
      name: '',
      order: modules.length,
      topics: [],
    };
    setModules([...modules, newModule]);
    setExpandedModules(new Set([...expandedModules, newModule.id]));
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter((m) => m.id !== moduleId));
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      newSet.delete(moduleId);
      return newSet;
    });
  };

  const updateModule = (moduleId: string, field: keyof Module, value: string | number) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId ? { ...m, [field]: value } : m
      )
    );
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const addTopic = (moduleId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          const newTopic: Topic = {
            id: `topic-${Date.now()}-${Math.random()}`,
            name: '',
            content: '',
            order: m.topics.length,
          };
          return { ...m, topics: [...m.topics, newTopic] };
        }
        return m;
      })
    );
  };

  const removeTopic = (moduleId: string, topicId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            topics: m.topics.filter((t) => t.id !== topicId),
          };
        }
        return m;
      })
    );
  };

  const updateTopic = (moduleId: string, topicId: string, field: keyof Topic, value: string | number) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            topics: m.topics.map((t) =>
              t.id === topicId ? { ...t, [field]: value } : t
            ),
          };
        }
        return m;
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate modules - only require module number and name
    for (const module of modules) {
      if (!module.number || !module.name) {
        alert('Please fill in module number and name for all modules.');
        return;
      }
      // Topics are optional - don't block save if topics are incomplete
      // Users can add topics gradually
    }
    
    setLoading(true);
    try {
      // Ensure modules array is always included, even if empty
      const modulesToSave = modules
        .filter((m) => m && (m.number || m.name)) // Only process valid modules
        .map((m, index) => {
          try {
            // Safely process topics - preserve all topics, even if incomplete
            let topicsToSave: any[] = [];
            if (Array.isArray(m.topics) && m.topics.length > 0) {
              topicsToSave = m.topics
                .filter((t) => t) // Filter out null/undefined topics
                .map((t) => ({
                  id: t.id || `topic-${index}-${Date.now()}-${Math.random()}`,
                  name: t.name || '',
                  content: t.content || '',
                  order: t.order ?? 0,
                }));
            }
            
            return {
              id: m.id || `module-${index}-${Date.now()}`,
              number: m.number || String(index + 1),
              name: m.name || '',
              order: m.order ?? index,
              topics: topicsToSave,
            };
          } catch (error) {
            console.error('Error processing module:', m, error);
            // Return a safe module object even if processing fails
            return {
              id: m.id || `module-${index}-${Date.now()}`,
              number: m.number || String(index + 1),
              name: m.name || '',
              order: m.order ?? index,
              topics: [],
            };
          }
        });
      
      // CRITICAL: Ensure modules array is never empty or undefined if modules exist in state
      if (modules.length > 0) {
        if (modulesToSave.length === 0) {
          console.error('ERROR: modulesToSave is empty but modules state has data!');
          console.error('Original modules:', modules);
          alert('Error: Modules would be lost! Please try again or refresh the page.');
          setLoading(false);
          return;
        }
        
        // Double-check: ensure all modules from state are in modulesToSave
        const moduleNumbers = new Set(modules.map(m => m.number || m.name));
        const savedModuleNumbers = new Set(modulesToSave.map(m => m.number || m.name));
        const missingModules = Array.from(moduleNumbers).filter(num => !savedModuleNumbers.has(num));
        
        if (missingModules.length > 0) {
          console.error('ERROR: Some modules are missing from save!', missingModules);
          alert(`Error: Some modules would be lost (${missingModules.join(', ')}). Please try again.`);
          setLoading(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        modules: modulesToSave, // Always include modules array
      };

      console.log('Saving data:', JSON.stringify(dataToSave, null, 2));
      console.log('Modules count to save:', modulesToSave.length);
      console.log('Modules to save:', modulesToSave);
      console.log('Original modules state:', modules);

      let savedSubjectId = subject?.id;
      
      if (subject?.id) {
        console.log('Updating subject with ID:', subject.id);
        await adminService.updateModule(subject.id, dataToSave);
        console.log('Subject updated successfully');
        savedSubjectId = subject.id;
      } else {
        savedSubjectId = await adminService.createModule(dataToSave);
        console.log('Subject created successfully with ID:', savedSubjectId);
      }
      
      // Verify the save by reading it back immediately
      if (savedSubjectId) {
        const verifyData = await adminService.getModule(savedSubjectId);
        console.log('Verified saved data:', verifyData);
        console.log('Verified modules count:', verifyData?.modules?.length);
        console.log('Verified modules:', verifyData?.modules);
        
        if (!verifyData?.modules || verifyData.modules.length === 0) {
          if (modules.length > 0) {
            console.error('CRITICAL ERROR: Modules were not saved!');
            alert('ERROR: Modules were not saved correctly. Please try again or contact support.');
            setLoading(false);
            return;
          }
        } else if (verifyData.modules.length !== modules.length) {
          console.warn('WARNING: Module count mismatch!');
          console.warn('Expected:', modules.length, 'Got:', verifyData.modules.length);
        }
      }
      
      // Success - refresh data
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving subject:', error);
      console.error('Error details:', error);
      alert(`Failed to save subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">
            {subject ? 'Edit Subject' : 'Create Subject'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-card"
          >
            <X className="h-5 w-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        {!hasCourses && !isEditMode && (
          <p className="rounded-lg bg-card/60 p-4 text-sm text-textSecondary">
            You need at least one course before you can add subjects.
          </p>
        )}

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Course *
            </label>
            <select
              required
              value={formData.courseId}
              onChange={(event) => handleChange('courseId', event.target.value)}
            className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={(!hasCourses && !isEditMode) || (!!preselectedCourseId && !isEditMode)}
            >
              <option value="" disabled>
                Select course
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            {!hasCourses && subject?.courseId && (
              <option value={subject.courseId}>{'Current course (archived)'}</option>
            )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Subject title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Brief description of the subject"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Duration *
              </label>
              <input
                required
                value={formData.duration}
                onChange={(event) => handleChange('duration', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 2 weeks"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Order *
              </label>
              <input
                required
                type="number"
                value={formData.order}
                onChange={(event) => handleChange('order', Number(event.target.value))}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(event) => handleChange('difficulty', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Modules Section */}
          <div className="mt-6 border-t border-card/50 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-text">Modules</label>
              <button
                type="button"
                onClick={addModule}
                className="flex items-center gap-2 rounded-lg bg-primary/20 text-primary px-3 py-2 hover:bg-primary/30 transition"
              >
                <Plus className="w-4 h-4" />
                Add Module
              </button>
            </div>

            {modules.length === 0 ? (
              <p className="text-sm text-textSecondary text-center py-4 bg-card/30 rounded-lg">
                No modules added. Click "Add Module" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {modules
                  .sort((a, b) => a.order - b.order)
                  .map((module) => (
                    <div
                      key={module.id}
                      className="border border-card/50 rounded-lg bg-card/30 overflow-hidden"
                    >
                      {/* Module Header */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => toggleModuleExpansion(module.id)}
                            className="flex items-center gap-2 text-text hover:text-primary transition"
                          >
                            {expandedModules.has(module.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              Module {modules.indexOf(module) + 1}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeModule(module.id)}
                            className="text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {expandedModules.has(module.id) && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-textSecondary">
                                  Module Number *
                                </label>
                                <input
                                  type="text"
                                  value={module.number}
                                  onChange={(e) =>
                                    updateModule(module.id, 'number', e.target.value)
                                  }
                                  className="w-full rounded-lg border border-card bg-card px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="e.g., 1, 2, 3"
                                  required
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-textSecondary">
                                  Module Name *
                                </label>
                                <input
                                  type="text"
                                  value={module.name}
                                  onChange={(e) =>
                                    updateModule(module.id, 'name', e.target.value)
                                  }
                                  className="w-full rounded-lg border border-card bg-card px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="e.g., Fundamentals of Python"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-card px-4 py-3 hover:bg-card/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-white transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : subject ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;

