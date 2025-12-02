'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Video, Play, Pause, Bookmark, Clock } from 'lucide-react';

interface VideoNote {
  id: string;
  timestamp: number;
  note: string;
  createdAt: string;
}

interface VideoLesson {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
  duration: string;
  transcript?: string;
}

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videos: VideoLesson[] = [
    {
      id: '1',
      title: 'Introduction to Machine Learning',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description: 'Learn the fundamentals of machine learning',
      duration: '15:30',
      transcript: 'Welcome to this course on machine learning. In this video, we will cover the basics of supervised learning, unsupervised learning, and reinforcement learning. Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.',
    },
    {
      id: '2',
      title: 'Deep Learning Fundamentals',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      description: 'Understanding neural networks and deep learning',
      duration: '20:15',
      transcript: 'Deep learning is a subset of machine learning that uses neural networks with multiple layers. These networks can learn complex patterns in data and are particularly effective for tasks like image recognition, natural language processing, and speech recognition.',
    },
  ];

  useEffect(() => {
    if (selectedVideo) {
      loadVideo(selectedVideo);
    }
  }, [selectedVideo]);

  const loadVideo = (video: VideoLesson) => {
    if (videoRef.current) {
      videoRef.current.src = video.videoUrl;
      videoRef.current.load();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const addTimestampedNote = () => {
    if (videoRef.current && selectedVideo) {
      const noteText = prompt('Enter your note:');
      if (noteText) {
        const newNote: VideoNote = {
          id: Date.now().toString(),
          timestamp: videoRef.current.currentTime,
          note: noteText,
          createdAt: new Date().toISOString(),
        };
        setNotes([...notes, newNote]);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-title flex items-center gap-3">
            <Video className="w-8 h-8 text-primary" />
            Video Lessons
          </h1>
          <p className="text-body">
            Watch lessons with timestamped notes and transcripts
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video List */}
          <div className="lg:col-span-1 space-y-4">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                onClick={() => {
                  setSelectedVideo(video);
                  setNotes([]);
                }}
                className={`glass p-4 rounded-xl cursor-pointer transition-all ${
                  selectedVideo?.id === video.id
                    ? 'ring-2 ring-primary shadow-glow'
                    : 'hover:shadow-glow'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-primary mt-1" />
                  <div className="flex-1">
                <h3 className="text-section mb-1">{video.title}</h3>
                <p className="text-body mb-2">{video.description}</p>
                <div className="flex items-center gap-2 text-caption">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Video Player */}
          <div className="lg:col-span-2">
            {selectedVideo ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl overflow-hidden"
              >
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full"
                    controls={false}
                  />

                  {/* Custom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={togglePlay}
                        className="p-2 bg-primary rounded-full hover:bg-primary/90 transition-all"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <div className="flex-1 bg-white/20 h-1 rounded-full cursor-pointer relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percent = x / rect.width;
                          seekTo(percent * duration);
                        }}
                      >
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>

                      <span className="text-white text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>

                      <select
                        value={playbackRate}
                        onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                        className="bg-card text-text rounded px-2 py-1 text-sm"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-section">{selectedVideo.title}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={addTimestampedNote}
                        className="px-4 py-2 bg-card hover:bg-card/80 rounded-lg transition-all text-text"
                      >
                        <Bookmark className="w-4 h-4 inline mr-2" />
                        Add Note
                      </button>
                      <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          showTranscript
                            ? 'bg-primary text-white'
                            : 'bg-card hover:bg-card/80 text-text'
                        }`}
                      >
                        Transcript
                      </button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {notes.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-section mb-2">Timestamped Notes</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 bg-card/50 rounded-lg cursor-pointer hover:bg-card transition-all"
                            onClick={() => seekTo(note.timestamp)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-caption text-primary">
                                {formatTime(note.timestamp)}
                              </span>
                            </div>
                            <p className="text-body">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {showTranscript && selectedVideo.transcript && (
                    <div className="p-4 bg-card/50 rounded-lg">
                      <h3 className="text-section mb-2">Transcript</h3>
                      <p className="text-body whitespace-pre-wrap">
                        {selectedVideo.transcript}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass p-12 rounded-xl text-center">
                <Video className="w-16 h-16 text-textSecondary mx-auto mb-4" />
                <p className="text-textSecondary">Select a video to start watching</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

