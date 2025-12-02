'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '@/lib/services/adminService';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function PracticeTestsPage() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses for practice tests
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const allCourses = await adminService.getCourses();
        // Show only first 2 courses
        setCourses(allCourses.slice(0, 2));
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const tests: Test[] = [
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      description: 'Test your knowledge of ML basics',
      duration: 30,
      difficulty: 'beginner',
      questions: [
        {
          id: '1',
          question: 'What is supervised learning?',
          options: [
            'Learning with labeled data',
            'Learning without data',
            'Learning with unlabeled data',
            'Learning from rewards',
          ],
          correctAnswer: 0,
          explanation: 'Supervised learning uses labeled data to train models. The algorithm learns from input-output pairs to make predictions on new data.',
        },
        {
          id: '2',
          question: 'What is the purpose of a validation set?',
          options: [
            'To train the model',
            'To test the final model',
            'To tune hyperparameters',
            'To store data',
          ],
          correctAnswer: 2,
          explanation: 'Validation set is used to tune hyperparameters and prevent overfitting. It helps select the best model configuration before final testing.',
        },
        {
          id: '3',
          question: 'What is overfitting?',
          options: [
            'Model performs well on training and test data',
            'Model performs poorly on all data',
            'Model memorizes training data but fails on new data',
            'Model trains too slowly',
          ],
          correctAnswer: 2,
          explanation: 'Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new, unseen data.',
        },
      ],
    },
    {
      id: '2',
      title: 'Deep Learning Concepts',
      description: 'Advanced questions on neural networks',
      duration: 45,
      difficulty: 'intermediate',
      questions: [
        {
          id: '1',
          question: 'What is the purpose of dropout in neural networks?',
          options: [
            'To increase model complexity',
            'To prevent overfitting',
            'To speed up training',
            'To reduce memory usage',
          ],
          correctAnswer: 1,
          explanation: 'Dropout is a regularization technique that randomly sets some neurons to zero during training, preventing overfitting by reducing co-adaptation of neurons.',
        },
        {
          id: '2',
          question: 'What is backpropagation?',
          options: [
            'Forward pass through the network',
            'Algorithm to update weights using gradient descent',
            'Data preprocessing technique',
            'Model evaluation method',
          ],
          correctAnswer: 1,
          explanation: 'Backpropagation is the algorithm used to calculate gradients and update neural network weights during training using the chain rule of calculus.',
        },
      ],
    },
  ];

  const startTest = async (courseId: string) => {
    try {
      // Fetch practice test for the course from Firebase
      const testData: any = await adminService.getPracticeTest(courseId);
      
      if (!testData || !testData.questions || testData.questions.length === 0) {
        alert('Practice test not available for this course. Please contact admin.');
        return;
      }

      // Convert Firebase test data to Test format
      const test: Test = {
        id: testData.id || courseId,
        title: testData.title || 'Practice Test',
        description: testData.description || 'Test your knowledge',
        duration: testData.duration || 30,
        difficulty: testData.difficulty || 'beginner',
        questions: testData.questions.map((q: any, index: number) => ({
          id: q.id || `q-${index}`,
          question: q.question || q.prompt || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? q.correctOptionIndex ?? 0,
          explanation: q.explanation || '',
        })),
      };

      setSelectedTest(test);
      setTestStarted(true);
      setTestCompleted(false);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeRemaining(test.duration * 60);
      setResults(null);

      // Timer
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            submitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
    } catch (error) {
      console.error('Error loading practice test:', error);
      alert('Failed to load practice test. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const submitTest = () => {
    if (!selectedTest) return;
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    let correct = 0;
    const detailedResults = selectedTest.questions.map((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correct++;

      return {
        question: q.question,
        userAnswer: q.options[userAnswer] || 'Not answered',
        correctAnswer: q.options[q.correctAnswer],
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = (correct / selectedTest.questions.length) * 100;

    setResults({
      score,
      correct,
      total: selectedTest.questions.length,
      detailedResults,
    });

    setTestCompleted(true);
    setTestStarted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (testStarted && selectedTest) {
    const currentQuestion = selectedTest.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === selectedTest.questions.length - 1;

    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Test Header */}
          <div className="bg-black modern-card glow-border p-4 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text">{selectedTest.title}</h2>
              <p className="text-sm text-textSecondary">
                Question {currentQuestionIndex + 1} of {selectedTest.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-bold text-text">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="bg-black modern-card glow-border p-6 rounded-xl">
            <h3 className="text-lg font-bold text-text mb-6">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: index })}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    answers[currentQuestion.id] === index
                      ? 'bg-primary text-white'
                      : 'bg-card/50 text-text hover:bg-card'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-card hover:bg-card/80 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-text"
            >
              Previous
            </button>
            {isLastQuestion ? (
              <button
                onClick={submitTest}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
              >
                Submit Test
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (testCompleted && results) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black modern-card glow-border p-8 rounded-xl text-center"
          >
            <h2 className="text-3xl font-bold text-text mb-4">Test Results</h2>
            <div className="text-6xl font-bold text-primary mb-4">{results.score.toFixed(0)}%</div>
            <p className="text-textSecondary mb-6">
              You got {results.correct} out of {results.total} questions correct
            </p>

            {/* Performance Chart */}
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: 'Score', value: results.score }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4 text-left max-h-96 overflow-y-auto">
              {results.detailedResults.map((result: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-card/50 rounded-lg"
                >
                  <div className="flex items-start gap-3 mb-2">
                    {result.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-text mb-2">{result.question}</p>
                      <p className="text-sm text-textSecondary mb-1">
                        Your answer: <span className={result.isCorrect ? 'text-green-400' : 'text-red-400'}>
                          {result.userAnswer}
                        </span>
                      </p>
                      <p className="text-sm text-textSecondary mb-2">
                        Correct answer: <span className="text-green-400">{result.correctAnswer}</span>
                      </p>
                      <p className="text-sm text-textSecondary italic">{result.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setTestCompleted(false);
                setResults(null);
                setSelectedTest(null);
              }}
              className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
            >
              Take Another Test
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Practice Tests
          </h1>
          <p className="text-textSecondary">
            Test your knowledge with mock exams and detailed explanations
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">Loading practice tests...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">No practice tests available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => {
              // Get practice test info if available
              const testInfo = tests.find((t) => t.id === course.id);
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black modern-card glow-border p-6 rounded-xl hover:shadow-glow transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <span className={`px-2 py-1 rounded text-xs ${
                      testInfo?.difficulty === 'beginner' || !testInfo ? 'bg-green-500/20 text-green-400' :
                      testInfo.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {testInfo?.difficulty || 'beginner'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text mb-2">{course.title}</h3>
                  <p className="text-textSecondary mb-4">{course.description || 'Comprehensive practice test covering all subjects in this course'}</p>
                  <div className="flex items-center justify-between text-sm text-textSecondary mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {testInfo?.duration || 30} minutes
                    </div>
                    <div>{testInfo?.questions?.length || 'Multiple'} questions</div>
                  </div>
                  <button
                    onClick={() => startTest(course.id)}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
                  >
                    Start Test
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

