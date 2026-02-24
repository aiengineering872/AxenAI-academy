'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Rocket, Sparkles, Menu, X, GraduationCap, Bot, Workflow, Mail, Phone, MapPin, Linkedin, Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const navLinks = [
  { label: 'Home', target: 'hero' },
  { label: 'Course', target: 'courses' },
  { label: 'Curriculum', target: 'curriculum' },
  { label: 'About', target: 'about' },
  { label: 'AI Tutor', target: 'ai-tutor' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
};

const Navigation: React.FC<{
  isScrolled: boolean;
  menuOpen: boolean;
  toggleMenu: () => void;
  onNavClick: (target: string) => void;
  onEnroll: () => void;
}> = ({ isScrolled, menuOpen, toggleMenu, onNavClick, onEnroll }) => (
  <header
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'backdrop-blur-lg bg-[#05050a]/88 shadow-lg shadow-[0_0_25px_rgba(255,107,53,0.12)] border-b border-white/5'
        : 'bg-transparent'
    }`}
  >
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
      <button
        onClick={() => onNavClick('hero')}
        className="flex items-center focus:outline-none"
        aria-label="Axen AI home"
      >
        <img
          src="/axen-logo.png"
          alt="Axen AI Academy logo"
          className="h-14 w-auto rounded-xl bg-transparent shadow-lg shadow-[0_0_24px_rgba(255,107,53,0.25)]"
          width={200}
          height={56}
          loading="lazy"
        />
      </button>

      <div className="hidden items-center gap-10 lg:flex">
        <div className="flex items-center gap-6 text-sm font-medium text-white/70">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => onNavClick(link.target)}
              className="transition-colors hover:text-white focus:outline-none"
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEnroll}
            className="group rounded-full bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] px-6 py-2 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,107,53,0.45)] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_32px_rgba(255,69,0,0.45)] focus:outline-none"
          >
            Enroll Now
          </button>
        </div>
      </div>

      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 p-2 text-white transition-colors hover:bg-white/10 focus:outline-none lg:hidden"
        aria-label="Toggle navigation menu"
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </nav>

    <motion.div
      initial={false}
      animate={menuOpen ? 'open' : 'closed'}
      className="lg:hidden"
    >
      <motion.div
        variants={{
          closed: { height: 0, opacity: 0 },
          open: { height: 'auto', opacity: 1 },
        }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="overflow-hidden border-t border-white/10 bg-[#05050a]/95 backdrop-blur-xl"
      >
        <div className="flex flex-col gap-4 px-6 py-6 text-sm font-medium text-white/70">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => onNavClick(link.target)}
              className="text-left transition-colors hover:text-white focus:outline-none"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={onEnroll}
            className="rounded-full bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] px-6 py-2 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,107,53,0.45)] hover:shadow-[0_0_32px_rgba(255,69,0,0.45)] focus:outline-none"
          >
            Enroll Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  </header>
);

const DOT_POSITIONS = [
  { top: '8%', left: '12%', duration: 5.5, delay: 0.4 },
  { top: '18%', left: '32%', duration: 6.2, delay: 1.1 },
  { top: '6%', left: '58%', duration: 7.1, delay: 0.8 },
  { top: '22%', left: '72%', duration: 5.8, delay: 1.9 },
  { top: '34%', left: '18%', duration: 6.7, delay: 0.3 },
  { top: '42%', left: '48%', duration: 7.4, delay: 1.5 },
  { top: '28%', left: '86%', duration: 6.1, delay: 0.6 },
  { top: '52%', left: '10%', duration: 5.6, delay: 1.8 },
  { top: '58%', left: '28%', duration: 7.2, delay: 0.9 },
  { top: '46%', left: '66%', duration: 6.5, delay: 1.3 },
  { top: '64%', left: '80%', duration: 7.6, delay: 0.5 },
  { top: '72%', left: '38%', duration: 6.9, delay: 1.7 },
  { top: '78%', left: '18%', duration: 5.7, delay: 1.1 },
  { top: '84%', left: '54%', duration: 6.8, delay: 0.7 },
  { top: '88%', left: '74%', duration: 7.3, delay: 1.4 },
];

const AnimatedBackground: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -top-32 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff6b35]/25 via-transparent to-transparent blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.16),_transparent_45%),_radial-gradient(circle_at_20%_20%,_rgba(255,69,0,0.12),_transparent_55%)]" />
    <motion.div
      className="absolute inset-0"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 1.2 },
        },
      }}
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.04]" />
    </motion.div>
    <motion.div
      className="absolute inset-0"
      animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
      transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
      style={{
        backgroundImage:
          'radial-gradient(circle at center, rgba(255,107,53,0.16) 0, rgba(15,23,42,0) 55%)',
      }}
    />
    {DOT_POSITIONS.map((dot, index) => (
      <motion.span
        key={`dot-${index}`}
        className="absolute block h-[3px] w-[3px] rounded-full bg-[#ff6b35]/70"
        style={{ top: dot.top, left: dot.left }}
        animate={{
          opacity: [0.25, 0.9, 0.25],
          scale: [1, 1.6, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: dot.duration,
          delay: dot.delay,
        }}
      />
    ))}
  </div>
);

const HeroSection: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => (
  <section
    id="hero"
    className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#0A0A0F] pt-24 text-white"
  >
    <AnimatedBackground />

    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pt-20 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
      <motion.div
        className="max-w-2xl space-y-8"
        initial={{ opacity: 1, y: 0 }}
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
              delayChildren: 0.02,
              staggerChildren: 0.04,
            },
          },
        }}
      >
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.4em] text-white/60"
          variants={fadeInUp}
        >
          <Sparkles className="h-4 w-4 text-[#ff6b35]" />
          Master AI with Hands-on Learning
        </motion.div>

        <motion.h1
          className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
          variants={fadeInUp}
        >
          Learn AI Skills
          <br />
          <span className="bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] bg-clip-text text-transparent">
            Build Your Future
          </span>
        </motion.h1>

        <motion.p
          className="text-lg leading-relaxed text-white/70 sm:text-xl"
          variants={fadeInUp}
        >
          Master AI Engineering & ML with comprehensive courses covering Machine Learning,
          Deep Learning, GenAI, and MLOps — guided by your personal AI Tutor.
        </motion.p>

        <motion.div variants={fadeInUp}>
          <button
            onClick={onEnroll}
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] px-8 py-3 text-lg font-semibold text-[#120602] shadow-[0_0_32px_rgba(255,107,53,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_42px_rgba(255,69,0,0.55)] focus:outline-none"
          >
            Explore Courses
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        className="relative w-full max-w-lg"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.02, ease: 'easeOut' }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 via-white/2 to-transparent p-6 shadow-2xl shadow-[0_0_45px_rgba(255,107,53,0.18)] before:absolute before:-inset-[2px] before:-z-10 before:bg-gradient-to-r before:from-[#ff6b35]/20 before:via-[#ff4500]/15 before:to-[#ff8c42]/20 before:blur-3xl before:content-['']">
          <motion.div
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#020617]/90 shadow-[0_20px_45px_rgba(15,23,42,0.9)]"
            variants={fadeInUp}
            custom={0.5}
          >
            <div className="relative w-full">
              <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-2 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
                  <span>APP INTRO</span>
                </div>
              </div>
              <div className="relative w-full px-6 pb-6">
                <div className="aspect-video w-full overflow-hidden rounded-xl">
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/HaYpqofzmxc?rel=0&modestbranding=1&autoplay=0"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
);

const AboutSection: React.FC = () => (
  <section
    id="about"
    className="relative bg-[#07070d] py-24 text-white"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.18),_transparent_55%)]" />
    <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
      <motion.span
        className="text-sm font-semibold uppercase tracking-[0.45em] text-[#ffb26b]"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        About{' '}
        <span className="bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text font-bold text-transparent">
          Axen AI
        </span>
      </motion.span>
      <motion.h2
        className="mt-5 text-4xl font-bold sm:text-5xl"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        custom={0.1}
      >
        Your Journey to <span className="bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] bg-clip-text text-transparent">AI Mastery</span>
      </motion.h2>
      <motion.p
        className="mt-6 max-w-3xl text-lg leading-relaxed text-white/70"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        custom={0.2}
      >
        <span className="bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text font-semibold text-transparent">
          Axen AI Academy
        </span>{' '}
        is revolutionizing how students learn artificial intelligence. We combine cutting-edge
        curriculum with personalized AI tutoring to create an immersive learning experience that
        prepares you for the future of technology.
      </motion.p>

      <motion.div
        className="mt-12 grid gap-6 md:grid-cols-2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {[
          {
            title: 'AI-Powered Learning',
            description:
              'Learn with your personal AI Tutor that adapts to your pace and learning style.',
            icon: BrainCircuit,
          },
          {
            title: 'Practical Experience',
            description:
              '100+ hands-on projects and real-world applications to build your portfolio.',
            icon: Rocket,
          },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            className="group relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/12 via-white/5 to-transparent p-[1px] transition-all duration-300 hover:border-[#ff6b35]/60 hover:shadow-[0_0_35px_rgba(255,107,53,0.28)]"
            variants={fadeInUp}
            custom={0.3 + index * 0.1}
          >
            <div className="relative h-full rounded-3xl bg-[#05050a]/90 p-8 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_45px_rgba(255,107,53,0.25)] group-hover:bg-[#0a0f1f]/95">
              <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-[#ff8c42] to-[#ff4500] p-3 text-[#05050a] shadow-lg shadow-[0_12px_30px_rgba(255,107,53,0.25)] transition-transform duration-300 group-hover:scale-[1.08] group-hover:shadow-[0_16px_35px_rgba(255,107,53,0.35)]">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-[#ffcc99]">
                {feature.title}
              </h3>
              <p className="mt-4 text-sm text-white/65 transition-colors duration-300 group-hover:text-white/80">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const CoursesSection: React.FC = () => (
  <section
    id="courses"
    className="relative bg-[#05050a] py-24 text-white"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,107,53,0.14),_transparent_55%)]" />
    <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.span
          className="text-sm font-semibold uppercase tracking-[0.45em] text-[#ffb26b]"
          variants={fadeInUp}
        >
          Courses
        </motion.span>
        <motion.h2
          className="mt-4 text-4xl font-bold"
          variants={fadeInUp}
          custom={0.1}
        >
          Comprehensive AI Learning Programs
        </motion.h2>
        <motion.p
          className="mt-4 max-w-3xl text-lg text-white/70"
          variants={fadeInUp}
          custom={0.2}
        >
          Designed by industry experts, our cohort-based courses combine masterclasses, labs, and
          portfolio projects to build the exact skills top teams demand.
        </motion.p>
      </motion.div>

      <motion.div
        className="mt-12 grid gap-6 md:grid-cols-2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {[
          {
            title: 'AI Engineering',
            description:
              'Build production-ready AI systems using LLMs, modern frameworks, and real-world deployment workflows.',
            highlights: ['LLMs', 'LangChain', 'Agentic AI', 'Model Development', 'AI Frameworks', 'Vibe Coding', 'Deployment'],
          },
          {
            title: 'AIML Engineering',
            description:
              'Master AI from Python fundamentals to Machine Learning, Deep Learning, and Generative AI with hands-on projects.',
            highlights: ['Python', 'Machine Learning', 'Deep Learning', 'Generative AI', 'Data Handling', 'Model Training', 'AI Projects'],
          },
        ].map((course, index) => (
          <motion.div
            key={course.title}
            className="group relative overflow-hidden rounded-3xl border border-white/12 bg-[#0c101c]/80 backdrop-blur-xl transition-all duration-300 hover:border-[#ff8250]/65 hover:shadow-[0_20px_45px_rgba(255,107,53,0.25)]"
            variants={fadeInUp}
            custom={0.3 + index * 0.1}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#ff6b35]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex h-full flex-col gap-6 px-8 py-10">
              <div className="relative">
                <h3 className="text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-[#ffe3d0]">
                  {course.title}
                </h3>
                <p className="mt-4 text-sm text-white/70 transition-colors duration-300 group-hover:text-white/85">
                  {course.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {course.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition-all duration-300 group-hover:border-[#ff8c42]/60 group-hover:bg-[#ff6b35]/20 group-hover:text-[#ffe3d0]"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <motion.button
                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-white/70 transition-all duration-300 group-hover:border-[#ff8c42]/70 group-hover:bg-[#ff6b35]/25 group-hover:text-[#ffe3d0]"
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 18 }}
              >
                →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const CurriculumSection: React.FC = () => (
  <section
    id="curriculum"
    className="relative bg-[#07070d] py-24 text-white"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.13),_transparent_55%)]" />
    <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.span
          className="text-sm font-semibold uppercase tracking-[0.45em] text-[#ffb26b]"
          variants={fadeInUp}
        >
          Curriculum
        </motion.span>
        <motion.h2
          className="mt-4 text-4xl font-bold"
          variants={fadeInUp}
          custom={0.1}
        >
          Built for Modern AI Engineers
        </motion.h2>
        <motion.p
          className="mt-4 max-w-3xl text-lg text-white/70"
          variants={fadeInUp}
          custom={0.2}
        >
          Our structured curriculum takes you from foundations to advanced applications through
          mentor-led sprints, code reviews, and live build weeks.
        </motion.p>
      </motion.div>

      <motion.div
        className="mt-12 grid gap-8 md:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {[
          {
            title: 'Phase 1 — Foundations',
            duration: 'Phase 1',
            items: ['Python for AI', 'Mathematics for ML', 'Data Processing & Visualization', 'Machine Learning Basics'],
          },
          {
            title: 'Phase 2 — Advanced AI & Deep Learning',
            duration: 'Phase 2',
            items: ['Neural Networks & CNNs', 'Transformers & NLP', 'Generative AI & Prompt Engineering', 'LangChain & AI Frameworks', 'Agentic AI Systems'],
          },
          {
            title: 'Phase 3 — Production & Real-World AI',
            duration: 'Phase 3',
            items: ['Model Deployment & APIs', 'MLOps & Monitoring', 'Optimization & Scaling', 'Real-World Capstone Project'],
          },
        ].map((phase, index) => (
          <motion.div
            key={phase.title}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c101c]/80 p-8 backdrop-blur-xl transition-all duration-300 hover:border-[#ff8250]/60 hover:shadow-[0_18px_38px_rgba(255,107,53,0.22)]"
            variants={fadeInUp}
            custom={0.3 + index * 0.1}
            whileHover={{ y: -6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/8 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex h-full flex-col gap-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/45 transition-colors duration-300 group-hover:text-[#ffb26b]">
                <span>{phase.duration}</span>
                <Workflow className="h-4 w-4 text-[#ff8250]" />
              </div>
              <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-[#ffe3d0]">
                {phase.title}
              </h3>
              <ul className="space-y-3 text-sm text-white/65 transition-colors duration-300 group-hover:text-white/82">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#ff6b35]/80 transition-transform duration-300 group-hover:scale-125" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const TutorSection: React.FC = () => (
  <section
    id="ai-tutor"
    className="relative bg-[#05050a] py-24 text-white"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,107,53,0.14),_transparent_55%)]" />
    <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
      <motion.div
        className="grid gap-12 lg:grid-cols-2 lg:items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeInUp}>
          <motion.span
            className="text-sm font-semibold uppercase tracking-[0.45em] text-[#ffb26b]"
            variants={fadeInUp}
          >
            AI Tutor
          </motion.span>
          <motion.h2
            className="mt-4 text-4xl font-bold"
            variants={fadeInUp}
            custom={0.1}
          >
            Personalized Mentorship at Scale
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-white/70"
            variants={fadeInUp}
            custom={0.2}
          >
            Meet Axen, your AI-powered mentor. Receive real-time code reviews, adaptive learning
            paths, and 24/7 support that evolves with your progress.
          </motion.p>

          <motion.div
            className="mt-10 grid gap-5 sm:grid-cols-2"
            variants={fadeInUp}
            custom={0.3}
          >
            {[
              'Dynamic learning roadmaps tailored to your goals',
              'Instant feedback on labs and projects',
              '1:1 mentor office hours every week',
              'Career guidance from hiring managers',
            ].map((item, index) => (
              <motion.div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65 backdrop-blur-xl"
                variants={fadeInUp}
                custom={0.35 + index * 0.05}
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0F172A]/70 p-6 shadow-2xl shadow-[0_0_45px_rgba(255,107,53,0.18)] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/50">
              <span>Live Session</span>
              <span className="bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500] bg-clip-text font-semibold text-transparent">
                Axen AI Mentor
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {[
                { title: 'Generative AI Design Patterns', progress: 78 },
                { title: 'Deploying LLM Apps at Scale', progress: 64 },
                { title: 'Observability for ML Pipelines', progress: 52 },
              ].map((card) => (
                <div key={card.title}>
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>{card.title}</span>
                    <span>{card.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#ff8c42] via-[#ff6b35] to-[#ff4500]"
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const LearningPathSection: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => (
  <section
    id="learning-path"
    className="relative overflow-hidden bg-[#07070d] py-24 text-white"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.16),_transparent_60%)]" />
    <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
      <motion.div
        className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div>
          <motion.span
            className="text-sm font-semibold uppercase tracking-[0.45em] text-[#ffb26b]"
            variants={fadeInUp}
          >
            Learning Path
          </motion.span>
          <motion.h2
            className="mt-4 text-4xl font-bold"
            variants={fadeInUp}
            custom={0.1}
          >
            From Foundations to Industry-Ready
          </motion.h2>
          <motion.p
            className="mt-4 max-w-2xl text-lg text-white/70"
            variants={fadeInUp}
            custom={0.2}
          >
            Step-by-step journeys with measurable milestones. Graduate with a portfolio of shipped
            AI products and the confidence to join high-performing ML teams.
          </motion.p>
        </div>

        <motion.button
          onClick={onEnroll}
          className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,107,53,0.35)] transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_35px_rgba(255,69,0,0.35)] focus:outline-none"
          variants={fadeInUp}
          custom={0.3}
        >
          Join the Next Cohort
        </motion.button>
      </motion.div>

      <motion.div
        className="mt-12 grid gap-6 md:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {[
          { title: 'Weeks 1–2 — Foundations', meta: 'Foundations', detail: 'Core programming, AI basics, and roadmap planning to start your AI journey with clarity.' },
          { title: 'Weeks 3–8 — Build & Practice', meta: 'Build & Practice', detail: 'Hands-on labs, real mini-projects, model training, and framework implementation with mentor guidance.' },
          { title: 'Weeks 9–12 — Capstone & Deployment', meta: 'Capstone & Deployment', detail: 'Develop real AI applications, deploy models, and build a portfolio ready for industry opportunities.' },
        ].map((step, index) => (
          <motion.div
            key={step.title}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
            variants={fadeInUp}
            custom={0.4 + index * 0.1}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/50">
              <span>{step.meta}</span>
              <GraduationCap className="h-5 w-5 text-[#ffb26b]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-4 text-sm text-white/65">{step.detail}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeStatus('loading');
    try {
      await adminService.addLead(email.trim());
      setEmail('');
      setSubscribeStatus('success');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    } catch {
      setSubscribeStatus('error');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    }
  };

  return (
    <footer className="relative bg-[#05050a] py-10 text-white/60">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6b35]/40 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Left Column - Branding & Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/axen-logo.png"
                alt="Axen AI Academy logo"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-white">AI Engineer & AIML Engineer Platform</p>
            <p className="text-xs text-white/80">AI Engineer & AIML Engineer Platform Powered By Agentic AI Training & Consultancy</p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#ff6b35]" />
                <a href="mailto:contact@axenai.in" className="hover:text-white transition-colors">
                  contact@axenai.in
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#ff6b35]" />
                <a href="tel:+917995410143" className="hover:text-white transition-colors">
                  +91 7995410143
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[#ff6b35]" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>

          {/* Second Column - Quick Links */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-[#ff6b35] pb-2">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition-colors">Course</a>
              </li>
              <li>
                <a href="#curriculum" className="hover:text-white transition-colors">Curriculum</a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">About</a>
              </li>
              <li>
                <a href="#ai-tutor" className="hover:text-white transition-colors">AI Tutor</a>
              </li>
            </ul>
          </div>

          {/* Third Column - Our Services */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-[#ff6b35] pb-2">
              Our Services
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#courses" className="hover:text-white transition-colors">AI Analytics Training</a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition-colors">Self-Paced Learning</a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition-colors">AI Consultancy</a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition-colors">Agentic AI Solutions</a>
              </li>
            </ul>
          </div>

          {/* Right Column - Stay Connected */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Stay Connected</h3>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded bg-[#0a0a0f] px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
              />
              <button
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff8c42] disabled:opacity-70"
              >
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </button>
              {subscribeStatus === 'success' && (
                <p className="text-xs text-green-400">Thanks for subscribing!</p>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
              )}
            </form>
            <div className="flex gap-2 pt-2">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded bg-[#0a0a0f] text-white transition-colors hover:bg-[#ff6b35]"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded bg-[#0a0a0f] text-white transition-colors hover:bg-[#ff6b35]"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/axen_ai/"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded bg-[#0a0a0f] text-white transition-colors hover:bg-[#ff6b35]"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@axen-ai01"  
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded bg-[#0a0a0f] text-white transition-colors hover:bg-[#ff6b35]"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        {/* Copyright */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Axen AI Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = useCallback((target: string) => {
    setMenuOpen(false);
    const section = document.getElementById(target);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleEnroll = useCallback(() => {
    setMenuOpen(false);
    // Use window.location for static export compatibility
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#05050a] font-['Inter',_'Poppins',sans-serif] text-white">
      <Navigation
        isScrolled={isScrolled}
        menuOpen={menuOpen}
        toggleMenu={() => setMenuOpen((prev) => !prev)}
        onNavClick={handleNavClick}
        onEnroll={handleEnroll}
      />
      <main className="pt-20">
        <HeroSection onEnroll={handleEnroll} />
        <CoursesSection />
        <CurriculumSection />
        <TutorSection />
        <LearningPathSection onEnroll={handleEnroll} />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}

