'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  order: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QuizQuestion) => void;
  question?: QuizQuestion | null;
}

const DEFAULT_OPTIONS = ['', '', '', ''];

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, onSave, question }) => {
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [order, setOrder] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setOptions(DEFAULT_OPTIONS);
      setCorrectOptionIndex(0);
      setExplanation('');
      setOrder(0);
      setDifficulty('easy');
      setSaving(false);
      return;
    }

    if (question) {
      setPrompt(question.prompt ?? '');
      if (Array.isArray(question.options) && question.options.length >= 2) {
        setOptions(question.options);
      } else {
        setOptions(DEFAULT_OPTIONS);
      }
      setCorrectOptionIndex(
        typeof question.correctOptionIndex === 'number' ? question.correctOptionIndex : 0
      );
      setExplanation(question.explanation ?? '');
      setOrder(question.order ?? 0);
      setDifficulty(question.difficulty ?? 'easy');
    } else {
      setPrompt('');
      setOptions(DEFAULT_OPTIONS);
      setCorrectOptionIndex(0);
      setExplanation('');
      setOrder(0);
      setDifficulty('easy');
    }
  }, [isOpen, question]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectOptionIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) {
      alert('Please enter a question prompt.');
      return;
    }

    const preparedOptions = options
      .map((opt, idx) => ({ value: opt.trim(), idx }))
      .filter((opt) => opt.value.length > 0);

    if (preparedOptions.length < 2) {
      alert('Please provide at least two answer options.');
      return;
    }

    let nextCorrectIndex = preparedOptions.findIndex((opt) => opt.idx === correctOptionIndex);
    if (nextCorrectIndex === -1) {
      nextCorrectIndex = 0;
    }

    if (nextCorrectIndex >= preparedOptions.length) {
      alert('Please select a valid correct answer.');
      return;
    }

    setSaving(true);
    try {
      const sanitizedOptions = preparedOptions.map((opt) => opt.value);
      const payload: QuizQuestion = {
        id: question?.id || `quiz-question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        prompt: prompt.trim(),
        options: sanitizedOptions,
        correctOptionIndex: nextCorrectIndex,
        explanation: explanation.trim(),
        order,
        difficulty,
      };
      onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="glass max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">
            {question ? 'Edit Question' : 'Add Question'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-card"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Question *
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Enter the quiz question"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">Order</label>
              <input
                type="number"
                value={order}
                min={0}
                onChange={(event) => setOrder(Number(event.target.value))}
                className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-textSecondary">Answer Options</label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-textSecondary">Correct</span>
                  </label>
                  <input
                    value={option}
                    onChange={(event) => handleOptionChange(index, event.target.value)}
                    className="flex-1 rounded-lg border border-card bg-card px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm text-primary transition hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          </div>

  <div>
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              Explanation (optional)
            </label>
            <textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              className="w-full rounded-lg border border-card bg-card px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Provide reasoning for the correct answer"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-card px-4 py-3 hover:bg-card/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-white transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : question ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizModal;

