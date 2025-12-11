'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
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
  const [results, setResults] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceTestsInfo, setPracticeTestsInfo] = useState<Record<string, any>>({});
  const [startingTest, setStartingTest] = useState<string | null>(null);

  // Fetch courses & tests info
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const allCourses = await adminService.getCourses();
        setCourses(allCourses);

        const testsInfo: Record<string, any> = {};
        for (const course of allCourses) {
          try {
            const testData: any = await adminService.getPracticeTest(course.id);
            if (
              testData &&
              Array.isArray(testData.questions) &&
              testData.questions.length > 0
            ) {
              testsInfo[course.id] = {
                difficulty: testData.difficulty || 'beginner',
                duration: testData.duration || 30,
                questionCount: testData.questions.length,
                title: testData.title || (course as any).title || 'Practice Test',
                description: testData.description || '',
              };
            }
          } catch {
            console.log(`No practice test found for course ${course.id}`);
          }
        }
        setPracticeTestsInfo(testsInfo);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const startTest = async (courseId: string) => {
    try {
      setStartingTest(courseId);
      const testData: any = await adminService.getPracticeTest(courseId);

      if (!testData || !Array.isArray(testData.questions) || testData.questions.length === 0) {
        console.log('Practice test not available for this course');
        setStartingTest(null);
        return;
      }

      const formattedQuestions: Question[] = testData.questions
        .map((q: any, index: number) => {
          const questionText = q.question || q.prompt || '';
          let options = Array.isArray(q.options) ? q.options : [];
          options = options.filter((opt: any) => opt && String(opt).trim().length > 0);

          const correctAnswer = q.correctAnswer !== undefined
            ? q.correctAnswer
            : (q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0);

          const validCorrectAnswer =
            options.length > 0 ? Math.max(0, Math.min(correctAnswer, options.length - 1)) : 0;

          return {
            id: q.id || `q-${index}`,
            question: questionText,
            options,
            correctAnswer: validCorrectAnswer,
            explanation: q.explanation || '',
          };
        })
        .filter((q: Question) => q.question && q.options.length >= 2);

      if (formattedQuestions.length === 0) {
        console.log('No valid questions found in this practice test');
        setStartingTest(null);
        return;
      }

      const test: Test = {
        id: testData.id || courseId,
        title: testData.title || 'Practice Test',
        description: testData.description || 'Test your knowledge',
        duration: testData.duration || 30,
        difficulty: testData.difficulty || 'beginner',
        questions: formattedQuestions,
      };

      setSelectedTest(test);
      setTestStarted(true);
      setTestCompleted(false);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setResults(null);
      setStartingTest(null);
    } catch (error) {
      console.error('Failed to load practice test:', error);
      setStartingTest(null);
    }
  };

  const submitTest = () => {
    if (!selectedTest) return;

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

  // =========================================
  // TEST IN PROGRESS UI
  // =========================================
  if (testStarted && selectedTest) {
    const currentQuestion = selectedTest.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === selectedTest.questions.length - 1;

    if (!currentQuestion) {
      return (
        <DashboardLayout>
          <div className="space-y-6">
            <div className="bg-black modern-card glow-border p-6 rounded-xl text-center">
              <p className="text-textSecondary">Error: Question not found. Please try again.</p>
              <button
                onClick={() => {
                  setTestStarted(false);
                  setSelectedTest(null);
                }}
                className="mt-4 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
              >
                Back to Tests
              </button>
            </div>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="space-y-6 relative z-0">
          {/* Header */}
          <div className="bg-black modern-card glow-border p-4 rounded-xl flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-xl font-bold text-text">{selectedTest.title}</h2>
              <p className="text-sm text-textSecondary">
                Question {currentQuestionIndex + 1} of {selectedTest.questions.length}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTestStarted(false);
                setSelectedTest(null);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
              className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all text-sm flex items-center gap-2 relative z-10 cursor-pointer"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" /> Exit Test
            </button>
          </div>

          {/* Progress */}
          <div className="bg-card/30 rounded-full h-2 overflow-hidden relative z-10">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / selectedTest.questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-black modern-card glow-border p-6 rounded-xl relative z-10">
            <h3 className="text-lg font-bold text-text mb-6">{currentQuestion.question}</h3>

            <div className="space-y-3 relative z-20">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAnswers((prevAnswers) => ({
                        ...prevAnswers,
                        [currentQuestion.id]: index,
                      }));
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-all border-2 relative z-20 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-glow-orange'
                        : 'bg-card/50 text-text hover:bg-card border-transparent hover:border-primary/30'
                    }`}
                    type="button"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
            {answers[currentQuestion.id] !== undefined && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-textSecondary">
                  ✓ Answer selected: <span className="text-primary font-medium">{String.fromCharCode(65 + answers[currentQuestion.id])}</span>
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-card hover:bg-card/80 rounded-lg transition-all disabled:opacity-50 text-text font-medium"
            >
              ← Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={submitTest}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium"
              >
                Submit Test →
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================
  // RESULTS UI
  // =========================================
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

            {/* Detailed Results */}
            <div className="space-y-4 text-left max-h-96 overflow-y-auto">
              {results.detailedResults.map((result: any, index: number) => (
                <div key={index} className="p-4 bg-card/50 rounded-lg">
                  <div className="flex items-start gap-3 mb-2">
                    {result.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mt-1" />
                    )}

                    <div className="flex-1">
                      <p className="font-bold text-text mb-2">{result.question}</p>
                      <p className="text-sm text-textSecondary mb-1">
                        Your answer:{' '}
                        <span className={result.isCorrect ? 'text-green-400' : 'text-red-400'}>
                          {result.userAnswer}
                        </span>
                      </p>
                      <p className="text-sm text-textSecondary mb-2">
                        Correct answer: <span className="text-green-400">{result.correctAnswer}</span>
                      </p>
                      {result.explanation && (
                        <p className="text-sm text-textSecondary italic">{result.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTestCompleted(false);
                setResults(null);
                setSelectedTest(null);
                setTestStarted(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
              className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium relative z-10 cursor-pointer"
              type="button"
            >
              Take Another Test
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================
  // COURSE LIST UI
  // =========================================
  const coursesWithTests = courses.filter((course) => practiceTestsInfo[course.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-text mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> Practice Tests
          </h1>
          <p className="text-textSecondary">Test your knowledge with mock exams & detailed explanations</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">Loading practice tests...</p>
          </div>
        ) : coursesWithTests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-textSecondary">
              No practice tests available. Please contact admin to add practice tests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coursesWithTests.map((course) => {
              const testInfo = practiceTestsInfo[course.id];

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black modern-card glow-border p-6 rounded-xl hover:shadow-glow transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        testInfo?.difficulty === 'beginner'
                          ? 'bg-green-500/20 text-green-400'
                          : testInfo?.difficulty === 'intermediate'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {testInfo?.difficulty}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-text mb-2">{testInfo?.title}</h3>
                  <p className="text-textSecondary mb-4">{testInfo?.description}</p>

                  <div className="flex items-center justify-between text-sm text-textSecondary mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {testInfo?.duration} minutes
                    </div>
                    <div>{testInfo?.questionCount} questions</div>
                  </div>

                  <div className="relative z-50">
                    <button
                      onClick={() => startTest(course.id)}
                      disabled={startingTest === course.id}
                      className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {startingTest === course.id ? 'Loading...' : 'Start Test'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
