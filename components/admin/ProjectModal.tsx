'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: any;
}

const defaultForm = {
  title: '',
  description: '',
  tags: '' as string,
  githubLink: '',
  isPublic: true,
  ownerName: 'Admin',
  ownerEmail: '',
  ownerUid: '',
};

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess, project }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm);
      setLoading(false);
      return;
    }

    if (project) {
      setForm({
        title: project.title ?? '',
        description: project.description ?? '',
        tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
        githubLink: project.githubLink ?? '',
        isPublic: project.isPublic ?? true,
        ownerName: project.userName ?? project.ownerName ?? 'Admin',
        ownerEmail: project.ownerEmail ?? project.userEmail ?? '',
        ownerUid: project.userId ?? '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [isOpen, project]);

  const parsedTags = useMemo(
    () =>
      form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags]
  );

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        tags: parsedTags,
        githubLink: form.githubLink || null,
        isPublic: true,
        userName: form.ownerName || 'Admin',
        ownerEmail: form.ownerEmail || null,
        userId: form.ownerUid || `admin_${Date.now()}`,
        upvotes: project?.upvotes ?? 0,
        comments: project?.comments ?? [],
        aiReview: project?.aiReview ?? null,
      } as Record<string, any>;

      if (project?.id) {
        await adminService.updateProject(project.id, payload);
      } else {
        payload.createdBy = 'admin';
        await adminService.createProject(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">{project ? 'Edit Project' : 'Create Project'}</h2>
          <button type="button" onClick={onClose} className="rounded p-2 transition hover:bg-card">
            <X className="h-5 w-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">Project Title *</label>
            <input
              required
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={5}
              placeholder="Describe your project..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(event) => handleChange('tags', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Machine Learning, Deep Learning"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">GitHub Link</label>
              <input
                value={form.githubLink}
                onChange={(event) => handleChange('githubLink', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://github.com/username/repo"
                type="url"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">Owner Name</label>
              <input
                value={form.ownerName}
                onChange={(event) => handleChange('ownerName', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Team member name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">Owner Email</label>
              <input
                value={form.ownerEmail}
                onChange={(event) => handleChange('ownerEmail', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="owner@example.com"
                type="email"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">Owner UID (optional)</label>
              <input
                value={form.ownerUid}
                onChange={(event) => handleChange('ownerUid', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Firebase user ID"
              />
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
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
