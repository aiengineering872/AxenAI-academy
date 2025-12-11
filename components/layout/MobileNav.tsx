'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BookOpen, Code, FlaskConical, MessageSquare, Trophy, Award, FileText, UserRound, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Learning', path: '/learning' },
  { icon: Code, label: 'Code Editor', path: '/simulator' },
  { icon: FlaskConical, label: 'Projects', path: '/projects' },
  { icon: MessageSquare, label: 'Mentor', path: '/mentor' },
  { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  { icon: Award, label: 'Certificates', path: '/certificates' },
  { icon: FileText, label: 'Practice Tests', path: '/practice-tests' },
  { icon: UserRound, label: 'Resume Builder', path: '/resume-builder' },
  { icon: Key, label: 'API Integration', path: '/api-integration' },
];

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-b border-card">
      <div className="flex items-center justify-between p-4">
        <img
          src="/axen-logo.png"
          alt="Axen AI Academy logo"
          className="h-10 w-auto"
          width={180}
          height={40}
          loading="lazy"
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-card rounded-lg transition-all"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-card border-t border-card"
          >
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                
                if (!Icon) {
                  console.error(`Icon is undefined for: ${item.label}`);
                  return null;
                }
                
                return (
                  <div
                    key={item.path}
                    onClick={() => {
                      setIsOpen(false);
                      if (typeof window !== 'undefined') {
                        window.location.href = item.path;
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-textSecondary hover:text-text hover:bg-card/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

