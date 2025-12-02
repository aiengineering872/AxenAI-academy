'use client';

import React, { useEffect, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import { storage } from '@/lib/firebase/config';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  topic?: any;
  moduleId: string;
  subjectId: string;
}

const defaultForm = {
  name: '',
  content: '',
  order: 0,
  pptTitle: '',
  pptUrl: '',
  googleColabUrl: '',
};

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  topic,
  moduleId,
  subjectId,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [pptUploading, setPptUploading] = useState(false);
  const [pptUploadProgress, setPptUploadProgress] = useState(0);
  const isEditMode = Boolean(topic);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setLoading(false);
      setPptFile(null);
      setPptUploading(false);
      setPptUploadProgress(0);
      return;
    }

    if (topic) {
      setFormData({
        name: topic.name ?? '',
        content: topic.content ?? '',
        order: topic.order ?? 0,
        pptTitle: topic.pptTitle ?? '',
        pptUrl: topic.pptUrl ?? '',
        googleColabUrl: topic.googleColabUrl ?? '',
      });
    } else {
      setFormData(defaultForm);
    }
  }, [isOpen, topic]);

  const handlePptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPptFile(file);
  };

  const handlePptUpload = async () => {
    if (!pptFile) {
      alert('Please choose a PPT file before uploading.');
      return;
    }

    if (!storage) {
      alert('Firebase storage is not configured. Please provide a public PPT link instead.');
      return;
    }

    try {
      setPptUploading(true);
      setPptUploadProgress(0);
      const timestamp = Date.now();
      const sanitizedName = pptFile.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
      const storagePath = `ppts/${subjectId}/${moduleId}/${timestamp}-${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, pptFile);

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setPptUploadProgress(progress);
          },
          (error) => reject(error),
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });

      setFormData((prev) => ({ ...prev, pptUrl: downloadUrl }));
      setPptFile(null);
      setPptUploadProgress(100);
      alert('PPT uploaded successfully! Link has been attached to this topic.');
    } catch (error: any) {
      console.error('Error uploading PPT:', error);
      const message =
        error?.code === 'storage/unauthorized'
          ? 'Upload blocked by storage rules. Please ensure your Firebase Storage rules allow admin users to upload.'
          : error?.message || 'Failed to upload PPT. Please try again or use a public link instead.';
      alert(message);
    } finally {
      setPptUploading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a topic name.');
      return;
    }

    setLoading(true);
    try {
      // Get current subject data
      const subjectData: any = await adminService.getModule(subjectId);
      if (!subjectData?.modules) {
        throw new Error('Subject or modules not found');
      }

      // Preserve all module data including IDs, numbers, names, orders
      const updatedModules = subjectData.modules.map((m: any, index: number) => {
        if (m.id === moduleId) {
          const topics = Array.isArray(m.topics) ? m.topics : [];
          let updatedTopics;

          if (isEditMode && topic?.id) {
            // Update existing topic
            updatedTopics = topics.map((t: any) =>
              t.id === topic.id
                ? {
                    id: t.id, // Preserve topic ID
                    name: formData.name,
                    content: formData.content,
                    order: formData.order,
                    pptTitle: formData.pptTitle,
                    pptUrl: formData.pptUrl,
                    googleColabUrl: formData.googleColabUrl,
                  }
                : {
                    // Preserve all topic fields
                    id: t.id || `topic-${index}-${Date.now()}`,
                    name: t.name || '',
                    content: t.content || '',
                    order: t.order ?? 0,
                    pptTitle: t.pptTitle || '',
                    pptUrl: t.pptUrl || '',
                    googleColabUrl: t.googleColabUrl || '',
                  }
            );
          } else {
            // Add new topic
            const newTopic = {
              id: `topic-${Date.now()}-${Math.random()}`,
              name: formData.name,
              content: formData.content,
              order: formData.order,
              pptTitle: formData.pptTitle,
              pptUrl: formData.pptUrl,
              googleColabUrl: formData.googleColabUrl,
            };
            updatedTopics = [...topics, newTopic];
          }

          // Preserve ALL module fields
          return {
            id: m.id || `module-${index}-${Date.now()}`,
            number: m.number || String(index + 1),
            name: m.name || '',
            order: m.order ?? index,
            topics: updatedTopics,
          };
        }
        // Preserve ALL fields for other modules
        return {
          id: m.id || `module-${index}-${Date.now()}`,
          number: m.number || String(index + 1),
          name: m.name || '',
          order: m.order ?? index,
          topics: Array.isArray(m.topics)
            ? m.topics.map((t: any, tIndex: number) => ({
                id: t.id || `topic-${index}-${tIndex}`,
                name: t.name || '',
                content: t.content || '',
                order: t.order ?? tIndex,
                pptTitle: t.pptTitle || '',
                pptUrl: t.pptUrl || '',
                googleColabUrl: t.googleColabUrl || '',
              }))
            : [],
        };
      });

      // Preserve all subject fields
      const dataToSave = {
        title: subjectData.title || '',
        description: subjectData.description || '',
        duration: subjectData.duration || '',
        difficulty: subjectData.difficulty || 'beginner',
        courseId: subjectData.courseId || '',
        order: subjectData.order ?? 0,
        modules: updatedModules, // Always include modules array
      };

      console.log('Saving topic - Modules count:', updatedModules.length);
      console.log('Saving topic - Modules:', updatedModules);
      console.log('Saving topic - Data to save:', dataToSave);

      await adminService.updateModule(subjectId, dataToSave);
      
      // Verify the save by reading it back
      const verifyData: any = await adminService.getModule(subjectId);
      console.log('Verified saved data - Modules count:', verifyData?.modules?.length);
      console.log('Verified saved data - Modules:', verifyData?.modules);
      
      if (!verifyData?.modules || verifyData.modules.length === 0) {
        if (updatedModules.length > 0) {
          console.error('CRITICAL ERROR: Modules were lost during save!');
          alert('ERROR: Modules were not saved correctly. Please refresh and try again.');
          setLoading(false);
          return;
        }
      } else if (verifyData.modules.length !== updatedModules.length) {
        console.warn('WARNING: Module count mismatch after save!');
        console.warn('Expected:', updatedModules.length, 'Got:', verifyData.modules.length);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving topic:', error);
      alert(`Failed to save topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            {topic ? 'Edit Topic' : 'Create Topic'}
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
          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Topic Name *
            </label>
            <input
              required
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., What is Python?"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(event) => handleChange('content', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[200px]"
              placeholder="Enter the main learning content for this topic..."
              rows={8}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                PPT Title
              </label>
              <input
                value={formData.pptTitle}
                onChange={(event) => handleChange('pptTitle', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Python Basics Slides"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                PPT Link / URL
              </label>
              <input
                type="url"
                value={formData.pptUrl}
                onChange={(event) => handleChange('pptUrl', event.target.value)}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
              <p className="mt-1 text-xs text-textSecondary">
                Provide a publicly accessible PPT link (Google Slides, OneDrive, etc.)
              </p>
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-textSecondary">
                  Or Upload PPT File
                </label>
                <input
                  type="file"
                  accept=".ppt,.pptx,.pdf"
                  onChange={handlePptFileChange}
                  className="w-full rounded-lg border border-dashed border-card bg-card/50 px-4 py-2 text-sm text-text"
                />
                <button
                  type="button"
                  onClick={handlePptUpload}
                  disabled={!pptFile || pptUploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UploadCloud className="h-4 w-4" />
                  {pptUploading ? 'Uploading...' : pptFile ? `Upload ${pptFile.name}` : 'Upload PPT'}
                </button>
                {pptUploading && (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-card/50">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${pptUploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-textSecondary">{pptUploadProgress}%</p>
                  </div>
                )}
                {pptFile && !pptUploading && (
                  <p className="text-xs text-textSecondary">
                    Selected: {pptFile.name} ({(pptFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Google Colab Code Link
            </label>
            <input
              type="url"
              value={formData.googleColabUrl}
              onChange={(event) => handleChange('googleColabUrl', event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://colab.research.google.com/..."
            />
            <p className="mt-1 text-xs text-textSecondary">
              Provide a Google Colab notebook link for hands-on coding practice
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(event) => handleChange('order', Number(event.target.value))}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              min={0}
            />
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
              disabled={loading || pptUploading}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-white transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : topic ? 'Update Topic' : 'Create Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;

