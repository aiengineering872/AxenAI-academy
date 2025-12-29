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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const isEditMode = Boolean(topic);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setLoading(false);
      setPptFile(null);
      setPptUploading(false);
      setPptUploadProgress(0);
      setUploadedFileName(null);
      setUploadSuccess(false);
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
      // If topic has a PPT URL, show it as uploaded
      if (topic.pptUrl) {
        setUploadedFileName(topic.pptTitle || 'PPT File');
        setUploadSuccess(true);
      }
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
      setUploadedFileName(pptFile.name);
      setUploadSuccess(true);
      setPptFile(null);
      setPptUploadProgress(100);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 5000);
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

    if (!moduleId || !subjectId) {
      alert('Module ID or Subject ID is missing. Please select a module first.');
      return;
    }

    setLoading(true);
    try {
      // Get current subject data
      const subjectData: any = await adminService.getModule(subjectId);
      if (!subjectData?.modules) {
        throw new Error('Subject or modules not found');
      }

      // Verify the module exists
      const moduleExists = subjectData.modules.some((m: any) => m.id === moduleId);
      if (!moduleExists) {
        throw new Error(`Module with ID ${moduleId} not found in subject`);
      }

      // Preserve all module data including IDs, numbers, names, orders
      const updatedModules = subjectData.modules.map((m: any, index: number) => {
        if (m.id === moduleId) {
          const topics = Array.isArray(m.topics) ? m.topics : [];
          let updatedTopics;

          if (isEditMode && topic?.id) {
            // Update existing topic
            // CRITICAL: Always preserve googleColabUrl from existing topic if not being updated
            updatedTopics = topics.map((t: any) =>
              t.id === topic.id
                ? {
                    id: t.id, // Preserve topic ID
                    name: formData.name,
                    content: formData.content,
                    order: formData.order,
                    pptTitle: formData.pptTitle,
                    pptUrl: formData.pptUrl,
                    // CRITICAL: Preserve googleColabUrl - use formData if provided, otherwise keep existing
                    googleColabUrl: formData.googleColabUrl || t.googleColabUrl || '',
                  }
                : {
                    // Preserve all topic fields - never remove googleColabUrl
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

      // Preserve ALL subject fields - merge with existing data to prevent data loss
      const dataToSave = {
        ...subjectData, // Preserve all existing fields first
        title: subjectData.title || '',
        description: subjectData.description || '',
        duration: subjectData.duration || '',
        difficulty: subjectData.difficulty || 'beginner',
        applicableCourses: subjectData.applicableCourses || [], // Preserve applicableCourses
        order: subjectData.order ?? 0,
        modules: updatedModules, // Always include modules array with all fields preserved
      };

      console.log('Saving topic - Modules count:', updatedModules.length);
      console.log('Saving topic - Modules:', updatedModules);
      console.log('Saving topic - Data to save:', dataToSave);

      // Use updateModule which now properly merges data
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

      // Call onSuccess before closing to trigger reload
      onSuccess();
      // Small delay to ensure state updates
      setTimeout(() => {
        onClose();
      }, 100);
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
                onChange={(event) => {
                  handleChange('pptUrl', event.target.value);
                  // Clear upload success when manually editing URL
                  if (event.target.value !== formData.pptUrl) {
                    setUploadSuccess(false);
                    setUploadedFileName(null);
                  }
                }}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://drive.google.com/file/d/..."
              />
              <p className="mt-1 text-xs text-textSecondary">
                Provide a publicly accessible PPT link (Google Slides, OneDrive, etc.)
              </p>
              
              {/* Show uploaded file info if URL exists */}
              {formData.pptUrl && !pptUploading && (
                <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <p className="text-sm font-medium text-green-400">
                      {uploadedFileName ? `File uploaded: ${uploadedFileName}` : 'PPT link is set'}
                    </p>
                  </div>
                  <p className="text-xs text-textSecondary mt-1 break-all">
                    URL: {formData.pptUrl.substring(0, 60)}...
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-textSecondary">
                  Or Upload PPT File
                </label>
                
                {/* File selection area */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".ppt,.pptx,.pdf"
                    onChange={handlePptFileChange}
                    className="w-full rounded-lg border border-dashed border-card bg-card/50 px-4 py-3 text-sm text-text cursor-pointer hover:border-primary/50 transition-colors"
                  />
                  {pptFile && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-sm font-medium text-primary">
                        ✓ Selected: {pptFile.name}
                      </p>
                      <p className="text-xs text-textSecondary">
                        Size: {(pptFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <button
                  type="button"
                  onClick={handlePptUpload}
                  disabled={!pptFile || pptUploading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UploadCloud className="h-4 w-4" />
                  {pptUploading ? (
                    <span>Uploading... {pptUploadProgress}%</span>
                  ) : pptFile ? (
                    `Upload ${pptFile.name}`
                  ) : (
                    'Upload PPT'
                  )}
                </button>

                {/* Upload progress */}
                {pptUploading && (
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-card/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${pptUploadProgress}%` }}
                      >
                        {pptUploadProgress > 10 && (
                          <span className="text-xs text-white font-medium">{pptUploadProgress}%</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-center text-textSecondary">
                      Uploading your file to Firebase Storage...
                    </p>
                  </div>
                )}

                {/* Success message */}
                {uploadSuccess && uploadedFileName && (
                  <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/40">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-400">
                          Upload Successful!
                        </p>
                        <p className="text-xs text-textSecondary">
                          {uploadedFileName} has been uploaded and linked to this topic.
                        </p>
                      </div>
                    </div>
                  </div>
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

