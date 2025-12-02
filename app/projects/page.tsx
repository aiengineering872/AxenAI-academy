'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Plus, ThumbsUp, MessageSquare, Upload, Github, Tag, Star, X, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/services/projectService';
import { formatDistanceToNow } from 'date-fns';

// Dynamically import DashboardLayout to avoid SSR issues
const DynamicDashboardLayout = dynamic(() => Promise.resolve(DashboardLayout), {
  ssr: false,
});

interface Project {
  id: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  title: string;
  description: string;
  tags: string[];
  githubLink?: string;
  isPublic: boolean;
  upvotes: number;
  upvotedUsers?: string[];
  comments: number;
  aiReview?: {
    innovation: number;
    accuracy: number;
    presentation: number;
    overallScore: number;
    feedback: string;
  };
  createdAt?: string | null;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt?: string | null;
}

const PROJECTS_CACHE_TTL = 60_000;
let projectCache: { data: Project[]; timestamp: number } | null = null;

export default function ProjectLabPage() {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: '',
    githubLink: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canUpload = useMemo(() => !!user, [user]);

  // Real-time projects listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = projectService.subscribeToProjects((updatedProjects) => {
          setProjects(updatedProjects as Project[]);
          setLoading(false);
          setError('');
        });
      } catch (err: any) {
        console.error('Error setting up real-time listener:', err);
        setError('Unable to load projects right now.');
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Real-time comments listener
  useEffect(() => {
    if (!selectedProjectId) {
      setComments([]);
      return;
    }

    const unsubscribe = projectService.subscribeToComments(selectedProjectId, (updatedComments) => {
      setComments(updatedComments as Comment[]);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedProjectId]);

  const handleUpvote = async (projectId: string) => {
    if (!user) {
      alert('Please sign in to upvote projects.');
      return;
    }

    try {
      await projectService.toggleUpvote(projectId, user.uid);
      // Real-time listener will update the UI automatically
    } catch (err: any) {
      console.error('Failed to toggle upvote:', err);
      alert(err.message || 'Failed to update upvote.');
    }
  };

  const handleAddComment = async () => {
    if (!selectedProjectId || !user || !newComment.trim()) {
      return;
    }

    try {
      await projectService.addComment(selectedProjectId, {
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userPhoto: user.photoURL || undefined,
        text: newComment.trim(),
      });
      setNewComment('');
      // Real-time listener will update comments automatically
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      alert(err.message || 'Failed to add comment.');
    }
  };

  const isUpvoted = (project: Project) => {
    return user && project.upvotedUsers?.includes(user.uid);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedProjectId) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await projectService.deleteComment(selectedProjectId, commentId);
      // Real-time listener will update comments automatically
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      alert(err.message || 'Failed to delete comment.');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return user && (comment.userId === user.uid || isAdmin);
  };

  const handleUpload = async () => {
    try {
      if (!user) {
        throw new Error('Please sign in to upload a project.');
      }

      const payload = {
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userPhoto: user.photoURL || null,
        title: newProject.title,
        description: newProject.description,
        tags: newProject.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        githubLink: newProject.githubLink || null,
        isPublic: true,
        upvotes: 0,
        upvotedUsers: [],
        comments: 0,
        aiReview: null,
      };

      await projectService.createProject(payload);
      // Real-time listener will update projects automatically
      setShowUploadModal(false);
      setNewProject({ title: '', description: '', tags: '', githubLink: '' });
    } catch (err: any) {
      console.error('Project upload failed:', err);
      alert(err.message || 'Failed to upload project.');
    }
  };

  return (
    <DynamicDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-display mb-2">AI Project Lab</h1>
            <p className="text-body">Showcase your AI projects and get feedback</p>
          </motion.div>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!canUpload}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {canUpload ? 'Upload Project' : 'Sign in to Upload'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-body">Loading projects...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : projects.length === 0 ? (
            <p className="text-body-strong">No projects yet. Be the first to upload one!</p>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black modern-card glow-border p-6 rounded-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {project.userPhoto ? (
                      <img
                        src={project.userPhoto}
                        alt={project.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {project.userName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-body-strong">{project.userName}</p>
                      <p className="text-caption">
                        {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-section mb-2">{project.title}</h3>
                <p className="text-body mb-4 line-clamp-3">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-caption bg-card rounded flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-body-strong text-primary hover:underline mb-4"
                  >
                    <Github className="w-4 h-4" />
                    View on GitHub
                  </a>
                )}

                {project.aiReview && (
                  <div className="mb-4 p-3 bg-card/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-caption">AI Review Score: {project.aiReview.overallScore}/10</span>
                    </div>
                    <p className="text-body">{project.aiReview.feedback}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-card">
                  <button
                    onClick={() => handleUpvote(project.id)}
                    className={`flex items-center gap-2 text-caption transition-all ${
                      isUpvoted(project)
                        ? 'text-primary'
                        : 'hover:text-primary'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${isUpvoted(project) ? 'fill-current' : ''}`} />
                    {project.upvotes}
                  </button>
                  <button
                    onClick={() => setSelectedProjectId(project.id)}
                    className="flex items-center gap-2 text-caption hover:text-primary transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {project.comments}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-title mb-4">Upload Project</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-caption font-medium mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="Enter project title"
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    rows={4}
                    placeholder="Describe your project..."
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newProject.tags}
                    onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="Machine Learning, Deep Learning, etc."
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-caption font-medium mb-2">
                    GitHub Link (optional)
                  </label>
                  <input
                    type="url"
                    value={newProject.githubLink}
                    onChange={(e) => setNewProject({ ...newProject, githubLink: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="https://github.com/username/repo"
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 bg-card hover:bg-card/80 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!newProject.title || !newProject.description}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Comments Modal */}
        {selectedProjectId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-title">Comments</h2>
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="p-2 hover:bg-card rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-textSecondary text-center py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-card/50 rounded-lg group hover:bg-card/70 transition-all">
                      {comment.userPhoto ? (
                        <img
                          src={comment.userPhoto}
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                          {comment.userName[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="text-body-strong text-sm">{comment.userName}</p>
                            {comment.createdAt && (
                              <p className="text-caption text-xs">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all text-red-400 hover:text-red-300"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-body text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user ? (
                <div className="flex gap-2 pt-4 border-t border-card">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-card border border-card rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                    placeholder="Write a comment..."
                    style={{ color: 'var(--color-text)' }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              ) : (
                <p className="text-textSecondary text-center py-4">Please sign in to add a comment.</p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </DynamicDashboardLayout>
  );
}
