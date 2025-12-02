'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  course?: any;
}

const levelOptions: Array<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced',
];

const defaultForm = {
  title: '',
  description: '',
  duration: '',
  levels: ['beginner'] as Array<'beginner' | 'intermediate' | 'advanced'>,
};

export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, onSuccess, course }) => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setLoading(false);
      return;
    }

    if (course) {
      setFormData({
        title: course.title ?? '',
        description: course.description ?? '',
        duration: course.duration ?? '',
        levels: Array.isArray(course.levels) && course.levels.length > 0 ? course.levels : ['beginner'],
      });
    } else {
      setFormData(defaultForm);
    }
  }, [isOpen, course]);

  const handleLevelToggle = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setFormData((prev) => {
      const exists = prev.levels.includes(level);
      if (exists) {
        const remaining = prev.levels.filter((item) => item !== level);
        return {
          ...prev,
          levels: remaining.length ? remaining : [level],
        };
      }

      return {
        ...prev,
        levels: [...prev.levels, level],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (course?.id) {
        await adminService.updateCourse(course.id, formData);
      } else {
        await adminService.createCourse({
          ...formData,
          modules: [],
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">{course ? 'Edit Course' : 'Create Course'}</h2>
          <button type="button" onClick={onClose} className="rounded p-2 transition hover:bg-card">
            <X className="h-5 w-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">Title *</label>
            <input
              required
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Course title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Brief overview of the course"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">Duration *</label>
            <input
              required
              value={formData.duration}
              onChange={(event) => setFormData((prev) => ({ ...prev, duration: event.target.value }))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., 6 weeks"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">Levels *</label>
            <div className="flex flex-wrap gap-3">
              {levelOptions.map((level) => {
                const selected = formData.levels.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelToggle(level)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      selected ? 'bg-primary text-white' : 'bg-card text-textSecondary hover:text-text'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-card px-4 py-3 hover:bg-card/80">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;

