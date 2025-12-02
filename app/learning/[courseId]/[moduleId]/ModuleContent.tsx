'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ArrowRight, ExternalLink, Video, Code2, Brain, Target, Grid3x3, ChevronRight, Code, ListChecks, FileText, Volume2, Square } from 'lucide-react';
import Link from 'next/link';
import { learningProgressService } from '@/lib/services/learningProgressService';
import { adminService } from '@/lib/services/adminService';

interface Topic {
  id: string;
  name: string;
  content: string;
  order: number;
  pptTitle?: string;
  pptUrl?: string;
  googleColabUrl?: string;
}

interface Module {
  id: string;
  number: string;
  name: string;
  order: number;
  topics: Topic[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  googleColabUrl?: string;
  simulators?: string[];
  completed: boolean;
  order?: number;
  pptTitle?: string;
  pptUrl?: string;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  order?: number;
  difficulty?: string;
}

interface ModuleContentProps {
  courseId: string;
  moduleId: string;
}

export default function ModuleContent({ courseId, moduleId }: ModuleContentProps) {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [subjectModules, setSubjectModules] = useState<Module[]>([]);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'review'>('idle');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const loadQuizForModule = React.useCallback(
    async (subjectId: string, subModuleId: string | undefined) => {
      if (!subModuleId) {
        setQuizQuestions([]);
        setQuizState('idle');
        setSelectedAnswers({});
        setQuizScore(0);
        return;
      }
      try {
        const quizData = await adminService.getQuiz(subjectId, subModuleId) as any;
        if (quizData?.questions && Array.isArray(quizData.questions)) {
          const sorted = [...quizData.questions].sort(
            (a: QuizQuestion, b: QuizQuestion) => (a.order ?? 0) - (b.order ?? 0)
          );
          setQuizQuestions(sorted);
        } else {
          setQuizQuestions([]);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        setQuizQuestions([]);
      } finally {
        setQuizState('idle');
        setSelectedAnswers({});
        setQuizScore(0);
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [moduleId, currentLesson]);

  // Load subject (moduleId) and its modules from Firebase
  useEffect(() => {
    const loadSubjectAndModules = async () => {
      if (!moduleId || !courseId) return;

      try {
        setLoading(true);
        
        // Fetch course and subject data in parallel
        const [courseData, subjectData] = await Promise.all([
          adminService.getCourse(courseId),
          adminService.getModule(moduleId),
        ]);
        
        // Set course title
        if (courseData && (courseData as any)?.title) {
          setCourseTitle((courseData as any).title);
        } else {
          setCourseTitle('');
        }
        
        if (!subjectData) {
          setModuleTitle('');
          setSubjectModules([]);
          setLessons([]);
          return;
        }
        
        // Set subject title
        const subject = subjectData as any;
        if (subject?.title) {
          setModuleTitle(subject.title);
        } else {
          setModuleTitle('');
        }
        
        // Load modules from subject - always preserve modules even if topics are missing
        console.log('Subject loaded:', subject);
        console.log('Subject modules:', subject?.modules);
        console.log('Is array?', Array.isArray(subject?.modules));
        console.log('Modules length:', subject?.modules?.length);
        console.log('Full subject data:', JSON.stringify(subject, null, 2));
        
        // Check for modules in various possible locations
        let modulesToProcess: any[] = [];
        if (subject?.modules && Array.isArray(subject.modules)) {
          modulesToProcess = subject.modules;
        } else if (Array.isArray(subject)) {
          // Subject itself might be an array of modules
          modulesToProcess = subject;
        }
        
        console.log('Modules to process:', modulesToProcess);
        console.log('Modules to process length:', modulesToProcess.length);
        
        if (modulesToProcess.length > 0) {
          // Process modules - preserve ALL modules, even if they're incomplete
          const processedModules: Module[] = modulesToProcess
            .filter((m: any) => m !== null && m !== undefined) // Only filter out null/undefined
            .map((m: any, index: number) => {
              // Safely process topics - preserve all topics
              let topics: Topic[] = [];
              try {
                if (Array.isArray(m.topics) && m.topics.length > 0) {
                  topics = m.topics
                    .filter((t: any) => t !== null && t !== undefined) // Only filter out null/undefined
                    .map((t: any, topicIndex: number) => ({
                      id: t.id || `topic-${index}-${topicIndex}-${Date.now()}`,
                      name: t.name || '',
                      content: t.content || '',
                      order: t.order ?? topicIndex,
                      pptTitle: t.pptTitle || '',
                      pptUrl: t.pptUrl || '',
                      googleColabUrl: t.googleColabUrl || '',
                    }));
                }
              } catch (error) {
                console.error('Error processing topics for module:', error);
                topics = []; // If topics are malformed, use empty array
              }
              
              // Always preserve module, even if incomplete
              return {
                id: m.id || `module-${index}-${Date.now()}`,
                number: m.number || String(index + 1),
                name: m.name || `Module ${index + 1}`,
                order: m.order ?? index,
                topics: topics,
              };
            });
          
          // Sort modules by order
          processedModules.sort((a, b) => a.order - b.order);
          console.log('Processed modules:', processedModules);
          console.log('Processed modules count:', processedModules.length);
          setSubjectModules(processedModules);
          
          // Auto-select first module if none selected
          if (selectedModuleIndex === null && processedModules.length > 0) {
            const firstModule = processedModules[0];
            setSelectedModuleIndex(0);
            // Convert topics to lessons
            const topicsAsLessons: Lesson[] = firstModule.topics
              .sort((a, b) => a.order - b.order)
              .map((topic) => ({
                id: topic.id,
                title: topic.name,
                content: topic.content,
                completed: learningProgressService.isLessonCompleted(
                  courseId,
                  moduleId,
                  `${firstModule.id}-${topic.id}`
                ),
                order: topic.order,
                pptTitle: topic.pptTitle,
                pptUrl: topic.pptUrl,
                googleColabUrl: topic.googleColabUrl,
              }));
            setLessons(topicsAsLessons);
            setCurrentLesson(0);
            void loadQuizForModule(moduleId, firstModule.id);
          } else if (selectedModuleIndex !== null && processedModules[selectedModuleIndex]) {
            const selectedModule = processedModules[selectedModuleIndex];
            const topicsAsLessons: Lesson[] = selectedModule.topics
              .sort((a, b) => a.order - b.order)
              .map((topic) => ({
                id: topic.id,
                title: topic.name,
                content: topic.content,
                completed: learningProgressService.isLessonCompleted(
                  courseId,
                  moduleId,
                  `${selectedModule.id}-${topic.id}`
                ),
                order: topic.order,
                pptTitle: topic.pptTitle,
                pptUrl: topic.pptUrl,
                googleColabUrl: topic.googleColabUrl,
              }));
            setLessons(topicsAsLessons);
            setCurrentLesson(0);
            void loadQuizForModule(moduleId, selectedModule.id);
          } else {
            setLessons([]);
            setQuizQuestions([]);
            setQuizState('idle');
            setSelectedAnswers({});
            setQuizScore(0);
          }
        } else {
          // No modules found - log for debugging
          console.warn('No modules found in subject:', subject);
          console.warn('Subject keys:', Object.keys(subject || {}));
          setSubjectModules([]);
          setLessons([]);
          setQuizQuestions([]);
          setQuizState('idle');
          setSelectedAnswers({});
          setQuizScore(0);
        }
      } catch (error) {
        console.error('Error loading subject and modules:', error);
        setLessons([]);
        setModuleTitle('');
        setSubjectModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubjectAndModules();
  }, [courseId, moduleId, loadQuizForModule]);

  // Convert module topics to lessons - defined before use
  const loadTopicsFromModule = React.useCallback((module: Module) => {
    if (!module || !module.topics || module.topics.length === 0) {
      setLessons([]);
      return;
    }

    // Convert topics to lessons format
    const topicsAsLessons: Lesson[] = module.topics
      .sort((a, b) => a.order - b.order)
      .map((topic) => ({
        id: topic.id,
        title: topic.name,
        content: topic.content,
        completed: learningProgressService.isLessonCompleted(
          courseId,
          moduleId,
          `${module.id}-${topic.id}`
        ),
        order: topic.order,
        pptTitle: topic.pptTitle,
        pptUrl: topic.pptUrl,
        googleColabUrl: topic.googleColabUrl,
      }));

    setLessons(topicsAsLessons);
    setCurrentLesson(0);
  }, [courseId, moduleId]);

  // Ensure first module is selected when modules are loaded
  useEffect(() => {
    if (subjectModules.length > 0 && selectedModuleIndex === null) {
      setSelectedModuleIndex(0);
      const firstModule = subjectModules[0];
      loadTopicsFromModule(firstModule);
    }
  }, [subjectModules.length, selectedModuleIndex, loadTopicsFromModule]);

  // Handle module selection
  const handleModuleSelect = (moduleIndex: number) => {
    if (moduleIndex >= 0 && moduleIndex < subjectModules.length) {
      setSelectedModuleIndex(moduleIndex);
      const selectedModule = subjectModules[moduleIndex];
      loadTopicsFromModule(selectedModule);
      void loadQuizForModule(moduleId, selectedModule.id);
    }
  };

  const handleLessonComplete = async () => {
    const currentLessonData = lessons[currentLesson];
    if (!currentLessonData) return;

    // Update local state
    const updatedLessons = [...lessons];
    updatedLessons[currentLesson].completed = true;
    setLessons(updatedLessons);

    // Save to storage
    await learningProgressService.saveLessonProgress(
      courseId,
      moduleId,
      currentLessonData.id,
      true
    );
  };

  const handleQuizStart = () => {
    if (quizQuestions.length === 0) return;
    setQuizState('active');
    setSelectedAnswers({});
    setQuizScore(0);
  };

  const handleQuizOptionSelect = (questionId: string, optionIndex: number) => {
    if (quizState === 'review') return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleQuizSubmit = () => {
    if (quizQuestions.length === 0) return;
    let score = 0;
    quizQuestions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctOptionIndex) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizState('review');
  };

  const handleQuizRetake = () => {
    setSelectedAnswers({});
    setQuizScore(0);
    setQuizState('active');
  };

  const handleQuizExit = () => {
    setSelectedAnswers({});
    setQuizScore(0);
    setQuizState('idle');
  };

  const allQuizQuestionsAnswered =
    quizQuestions.length > 0 &&
    quizQuestions.every((question) => typeof selectedAnswers[question.id] === 'number');

  const handleLessonClick = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setCurrentLesson(index);
      // Smooth scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const nextLesson = () => {
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
      // Smooth scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const prevLesson = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      // Smooth scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Format content to convert asterisks to bullet points
  const formatContent = (content: string) => {
    if (!content) return null;

    // Split content by lines
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`para-${elements.length}`} className="text-text text-lg leading-relaxed mb-4" style={{ color: '#e2e8f0' }}>
            {currentParagraph.join(' ')}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 ml-4">
            {currentList.map((item, index) => (
              <li key={index} className="text-lg leading-relaxed" style={{ color: '#e2e8f0' }}>
                {item.trim()}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Check if line starts with "* " (asterisk followed by space)
      if (trimmedLine.startsWith('* ')) {
        flushParagraph();
        // Remove the "* " prefix and add to list
        currentList.push(trimmedLine.substring(2));
      } else if (trimmedLine === '') {
        // Empty line - flush both paragraph and list
        flushParagraph();
        flushList();
      } else {
        // Regular text line
        flushList();
        currentParagraph.push(trimmedLine);
      }
    });

    // Flush any remaining content
    flushParagraph();
    flushList();

    return elements.length > 0 ? elements : null;
  };

  const renderVideoContent = (url: string) => {
    if (!url) return null;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    const youtubeMatch = trimmedUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{11})/
    );

    if (youtubeMatch?.[1]) {
      const embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      return (
        <div className="mb-6 aspect-video">
          <iframe
            src={embedUrl}
            title="Lesson video"
            className="h-full w-full rounded-lg border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmedUrl)) {
      return (
        <div className="mb-6 aspect-video">
          <video
            controls
            playsInline
            className="h-full w-full rounded-lg bg-card object-cover"
            src={trimmedUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return (
      <div className="mb-6 aspect-video">
        <iframe
          src={trimmedUrl}
          title="Lesson video"
          className="h-full w-full rounded-lg border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  };

  const stripMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/[*_~`>#-]/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getSafePptUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleOpenPpt = (pptUrl?: string) => {
    const safeUrl = getSafePptUrl(pptUrl);
    if (!safeUrl) {
      alert('PPT link is not available yet.');
      return;
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSpeakContent = () => {
    if (!speechSupported || !currentLessonData?.content || typeof window === 'undefined') {
      alert('Text to speech is not available right now.');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(stripMarkdown(currentLessonData.content));
      utterance.lang = 'en-IN';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      alert('Unable to play audio for this lesson.');
    }
  };

  const handleStopSpeaking = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (loading) {
    return (
      <ModuleLayout
        courseId={courseId}
        moduleId={moduleId}
        currentLessonIndex={currentLesson}
        onLessonClick={handleLessonClick}
        moduleTitle={moduleTitle}
        modules={subjectModules}
        selectedModuleIndex={selectedModuleIndex}
        onModuleSelect={handleModuleSelect}
        courseTitle={courseTitle}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/learning"
              className="text-primary hover:underline flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subjects
            </Link>
          </div>
          <div className="bg-black p-6 rounded-xl text-center">
            <p className="text-textSecondary">Loading module...</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  if (lessons.length === 0) {
    return (
      <ModuleLayout
        courseId={courseId}
        moduleId={moduleId}
        currentLessonIndex={currentLesson}
        onLessonClick={handleLessonClick}
        moduleTitle={moduleTitle}
        modules={subjectModules}
        selectedModuleIndex={selectedModuleIndex}
        onModuleSelect={handleModuleSelect}
        courseTitle={courseTitle}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/learning"
              className="text-primary hover:underline flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subjects
            </Link>
          </div>
          <div className="bg-black p-6 rounded-xl">
            {moduleTitle && <h1 className="text-3xl font-bold text-text mb-4">{moduleTitle}</h1>}
            <p className="text-textSecondary text-center py-8">No lessons available for this module yet. Please add lessons via the admin panel.</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  const currentLessonData = lessons[currentLesson];
  const currentLessonPptUrl = getSafePptUrl(currentLessonData?.pptUrl);
  const isFirstLessonInModule = currentLesson === 0;
  const hasCurrentLessonPpt = Boolean(currentLessonPptUrl);

  return (
    <ModuleLayout
      courseId={courseId}
      moduleId={moduleId}
      currentLessonIndex={currentLesson}
      onLessonClick={handleLessonClick}
      moduleTitle={moduleTitle}
      modules={subjectModules}
      selectedModuleIndex={selectedModuleIndex}
      onModuleSelect={handleModuleSelect}
      courseTitle={courseTitle}
    >
      <div className="space-y-6" ref={contentRef}>
        <div className="flex items-center justify-between">
          <Link
            href="/learning"
            className="text-primary hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subjects
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black p-6 rounded-xl"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              {moduleTitle && (
                <div>
                  <h1 className="text-3xl font-bold text-text mb-2">{moduleTitle}</h1>
                  {courseTitle && (
                    <p className="text-textSecondary text-sm">Course: {courseTitle}</p>
                  )}
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-text border-t border-card/50 pt-4 mt-4">
                {currentLessonData?.title}
              </h2>
            </div>
            
            <div className="flex flex-col gap-3 md:flex-row">
              {isFirstLessonInModule && (
                <button
                  onClick={() => handleOpenPpt(currentLessonData?.pptUrl)}
                  disabled={!hasCurrentLessonPpt}
                  title={
                    hasCurrentLessonPpt
                      ? 'Open module PPT'
                      : 'No PPT has been added for this module yet'
                  }
                  className={`inline-flex items-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    hasCurrentLessonPpt
                      ? 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                      : 'border border-card/40 bg-card/30 text-textSecondary opacity-60 cursor-not-allowed'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  OpenPPT
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={isSpeaking ? handleStopSpeaking : handleSpeakContent}
                disabled={!speechSupported || !currentLessonData?.content}
                className={`inline-flex items-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  !speechSupported || !currentLessonData?.content
                    ? 'border border-card/40 bg-card/30 text-textSecondary opacity-60 cursor-not-allowed'
                    : isSpeaking
                    ? 'border border-primary/70 bg-primary/20 text-primary hover:bg-primary/30'
                    : 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                }`}
                title={
                  speechSupported
                    ? 'Listen to this lesson content'
                    : 'Text to speech is not supported on this browser'
                }
              >
                {isSpeaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isSpeaking ? 'Stop Audio' : 'Listen'}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`flex-1 h-2 rounded ${
                    index === currentLesson
                      ? 'bg-primary'
                      : lesson.completed
                      ? 'bg-green-500'
                      : 'bg-card'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-textSecondary">
              Lesson {currentLesson + 1} of {lessons.length}
            </p>
          </div>

          <div className="prose prose-invert max-w-3xl mb-6">
            {formatContent(currentLessonData?.content || '')}
          </div>

          {/* Video Lectures and Simulators Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Video Lectures Section - Takes 2 columns */}
            <div className="lg:col-span-2 glass p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-text">Video Lectures</h3>
              </div>
              <div className="bg-card/50 rounded-xl p-4 flex items-center justify-center min-h-[400px]">
                {lessons[currentLesson]?.videoUrl ? (
                  <div className="w-full aspect-video">
                    {renderVideoContent(lessons[currentLesson]?.videoUrl || '')}
                  </div>
                ) : (
                  <div className="text-center">
                    <Video className="w-20 h-20 text-textSecondary mx-auto mb-4" />
                    <p className="text-textSecondary">No videos available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Simulators Section - Takes 1 column */}
            <div className="lg:col-span-1 glass p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Code2 className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-text">Simulators</h3>
              </div>
              <div className="space-y-3">
                {lessons[currentLesson]?.simulators && lessons[currentLesson]?.simulators.length > 0 ? (
                  lessons[currentLesson].simulators.map((simulatorName, index) => {
                    // Map simulator name to type for URL
                    const getSimulatorType = (name: string): string => {
                      const lowerName = name.toLowerCase();
                      if (lowerName.includes('machine learning') || lowerName.includes('ml')) {
                        return 'machine-learning';
                      }
                      if (lowerName.includes('bias') || lowerName.includes('variance')) {
                        return 'bias-variance';
                      }
                      if (lowerName.includes('confusion') || lowerName.includes('matrix')) {
                        return 'confusion-matrix';
                      }
                      // Default fallback
                      return 'machine-learning';
                    };

                    // Map simulator name to icon
                    const getSimulatorIcon = (name: string) => {
                      const lowerName = name.toLowerCase();
                      if (lowerName.includes('machine learning') || lowerName.includes('ml')) {
                        return Brain;
                      }
                      if (lowerName.includes('bias') || lowerName.includes('variance')) {
                        return Target;
                      }
                      if (lowerName.includes('confusion') || lowerName.includes('matrix')) {
                        return Grid3x3;
                      }
                      return Code;
                    };

                    const SimulatorIcon = getSimulatorIcon(simulatorName);
                    // Create URL-friendly topic name
                    const topicSlug = simulatorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                    return (
                      <Link key={index} href={`/simulator/topic/${topicSlug}`}>
                        <motion.div
                          whileHover={{ scale: 1.02, x: 4 }}
                          className="flex items-center gap-3 p-3 bg-card/50 rounded-xl hover:bg-card/70 cursor-pointer transition-all"
                        >
                          <SimulatorIcon className="w-5 h-5 text-primary" />
                          <span className="flex-1 text-text font-medium text-sm">{simulatorName}</span>
                          <ChevronRight className="w-4 h-4 text-textSecondary" />
                        </motion.div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <Code className="w-12 h-12 text-textSecondary mx-auto mb-2" />
                    <p className="text-textSecondary text-sm">No simulators available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {lessons[currentLesson]?.googleColabUrl && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text mb-3">Google Colab</h3>
              <a
                href={lessons[currentLesson]?.googleColabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium"
              >
                Open in Google Colab
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-card">
            <button
              onClick={prevLesson}
              disabled={currentLesson === 0}
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/80 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              {!lessons[currentLesson]?.completed && (
                <button
                  onClick={handleLessonComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}

              <button
                onClick={nextLesson}
                disabled={currentLesson === lessons.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quiz Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black p-6 rounded-xl"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-text">Practice Quiz</h2>
              </div>
              <p className="text-textSecondary">
                {quizQuestions.length === 0
                  ? 'Quiz coming soon for this module.'
                  : `Answer ${quizQuestions.length} question${quizQuestions.length === 1 ? '' : 's'} to check your understanding.`}
              </p>
            </div>
            {quizQuestions.length > 0 && quizState === 'idle' && (
              <button
                onClick={handleQuizStart}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
              >
                Start Quiz
              </button>
            )}
          </div>

          {quizQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-card/60 p-6 text-center text-textSecondary">
              No quiz has been published for this module yet.
            </div>
          ) : quizState === 'idle' ? (
            <div className="rounded-lg border border-card/40 bg-card/20 p-6 text-center">
              <p className="mb-4 text-textSecondary">
                Ready when you are! Click the button below to begin the quiz.
              </p>
              <button
                onClick={handleQuizStart}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
              >
                Start Quiz
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {quizQuestions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id];
                  return (
                    <div key={question.id} className="rounded-xl border border-card/50 bg-card/30 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-text">
                            Q{index + 1}. {question.prompt}
                          </p>
                          <p className="text-xs uppercase tracking-widest text-textSecondary mt-1">
                            Difficulty: {question.difficulty ?? 'easy'}
                          </p>
                        </div>
                        {quizState === 'review' && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              userAnswer === question.correctOptionIndex
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {userAnswer === question.correctOptionIndex ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        {question.options?.map((option, optionIndex) => {
                          const isSelected = userAnswer === optionIndex;
                          const isCorrect = optionIndex === question.correctOptionIndex;
                          let optionClasses =
                            'w-full text-left rounded-lg border px-4 py-3 text-sm transition';

                          if (quizState === 'review') {
                            if (isCorrect) {
                              optionClasses += ' border-green-500/60 bg-green-500/10 text-green-200';
                            } else if (isSelected) {
                              optionClasses += ' border-red-500/60 bg-red-500/10 text-red-200';
                            } else {
                              optionClasses += ' border-card/40 bg-card/20 text-text';
                            }
                          } else {
                            optionClasses += isSelected
                              ? ' border-primary/60 bg-primary/10 text-primary'
                              : ' border-card/40 bg-card/20 text-text hover:border-primary/40';
                          }

                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              disabled={quizState === 'review'}
                              onClick={() => handleQuizOptionSelect(question.id, optionIndex)}
                              className={optionClasses}
                            >
                              {optionIndex + 1}. {option}
                            </button>
                          );
                        })}
                      </div>

                      {quizState === 'review' && question.explanation && (
                        <div className="mt-3 rounded-lg bg-card/40 p-3 text-sm text-textSecondary">
                          <span className="font-semibold text-text">Explanation:</span> {question.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-card/50 pt-4 md:flex-row md:items-center md:justify-between">
                {quizState === 'active' ? (
                  <>
                    <p className="text-sm text-textSecondary">
                      {Object.keys(selectedAnswers).length} / {quizQuestions.length} answered
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleQuizExit}
                        className="px-4 py-2 rounded-lg border border-card/60 text-text hover:bg-card/40 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleQuizSubmit}
                        disabled={!allQuizQuestionsAnswered}
                        className="px-6 py-2 rounded-lg bg-primary text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Answers
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-semibold text-text">
                        Score: {quizScore} / {quizQuestions.length}
                      </p>
                      <p className="text-sm text-textSecondary">
                        {quizScore === quizQuestions.length
                          ? 'Perfect score!'
                          : quizScore >= quizQuestions.length / 2
                          ? 'Great job! Keep practicing to master it.'
                          : 'Keep practicing—you got this!'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleQuizRetake}
                        className="px-4 py-2 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition"
                      >
                        Retake Quiz
                      </button>
                      <button
                        onClick={handleQuizExit}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </ModuleLayout>
  );
}
