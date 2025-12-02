'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const bgColor =
    type === 'error'
      ? 'bg-red-500/20 border-red-500/50 text-red-300'
      : type === 'success'
      ? 'bg-green-500/20 border-green-500/50 text-green-300'
      : 'bg-blue-500/20 border-blue-500/50 text-blue-300';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 z-[200] rounded-lg border px-6 py-4 shadow-lg ${bgColor}`}
        >
          <div className="flex items-center gap-4">
            <p className="font-medium">{message}</p>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-black/20 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

