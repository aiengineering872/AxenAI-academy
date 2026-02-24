'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserRound, Download, Sparkles, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateGeminiResponse } from '@/lib/utils/gemini';

const EXPERIENCE_LEVEL_OPTIONS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Fresher',
  '1–2 Years',
  '3–5 Years',
  '5+ Years',
] as const;

type ExperienceLevel = (typeof EXPERIENCE_LEVEL_OPTIONS)[number];

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
  };
  summary: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  certificates: Array<{ name: string; issuer: string; year: string }>;
}

const initialEducation = () => ({ degree: '', institution: '', year: '' });
const initialCertificate = () => ({ name: '', issuer: '', year: '' });
const initialExperience = () => ({ title: '', company: '', duration: '', description: '' });

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
    },
    summary: '',
    skills: [],
    experienceLevel: 'Fresher',
    experience: [],
    education: [initialEducation()],
    certificates: [initialCertificate()],
  });
  const [pendingSkill, setPendingSkill] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [showFullPageResume, setShowFullPageResume] = useState(false);

  const isPersonalInfoFilled = useMemo(() => {
    const { name, email, phone, location } = resumeData.personalInfo;
    return Boolean(name?.trim() && email?.trim() && phone?.trim() && location?.trim());
  }, [resumeData.personalInfo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tryParseKeys = (storageKey: string) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      try {
        const stored = JSON.parse(raw) as Array<{ service: string; key: string }>;
        return stored.find(
          (e) =>
            e.service.toLowerCase().includes('gemini') || e.service.toLowerCase().includes('google')
        )?.key ?? null;
      } catch {
        return null;
      }
    };
    if (user?.uid) {
      const key = tryParseKeys(`apiKeys_${user.uid}`);
      if (key) {
        setGeminiApiKey(key);
        return;
      }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('apiKeys_')) {
        const k = tryParseKeys(key);
        if (k) {
          setGeminiApiKey(k);
          return;
        }
      }
    }
    setGeminiApiKey(null);
  }, [user]);

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, initialEducation()],
    }));
  };

  const addCertificate = () => {
    setResumeData((prev) => ({
      ...prev,
      certificates: [...prev.certificates, initialCertificate()],
    }));
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, initialExperience()],
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const removeCertificate = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const generateSummaryWithAI = async () => {
    if (!geminiApiKey || !isPersonalInfoFilled) return;
    setGeneratingSummary(true);
    try {
      const prompt = `Write a short professional summary (3–4 sentences) for a resume. Experience level: ${resumeData.experienceLevel}. Skills: ${resumeData.skills.join(', ') || 'Not specified'}. Return only the summary text, no labels or quotes.`;
      const text = await generateGeminiResponse(prompt, undefined, undefined, geminiApiKey);
      setResumeData((prev) => ({ ...prev, summary: text.trim() }));
    } catch (e) {
      console.error(e);
      alert('Failed to generate summary. Check your Gemini API key in API Integration.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const extractJson = (raw: string) => {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) return match[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1);
    return raw.trim();
  };

  const generateResumeWithAI = async () => {
    if (!geminiApiKey || !isPersonalInfoFilled) {
      alert('Fill required personal information and add a Gemini API key in API Integration to enable AI generation.');
      return;
    }
    setGeneratingResume(true);
    try {
      let skills = resumeData.skills;
      if (pendingSkill.trim()) {
        skills = Array.from(new Set([...resumeData.skills, ...pendingSkill.split(',').map((s) => s.trim()).filter(Boolean)]));
        setResumeData((prev) => ({ ...prev, skills }));
        setPendingSkill('');
      }

      const prompt = `You are an expert resume writer. Generate a polished resume from this data. Return ONLY valid JSON (no markdown) with this shape:
{ "summary": string, "skills": string[] }

User data:
- Personal: ${JSON.stringify(resumeData.personalInfo)}
- Experience level: ${resumeData.experienceLevel}
- Experience (roles): ${resumeData.experience.length ? JSON.stringify(resumeData.experience) : 'None'}
- Current summary: ${resumeData.summary || '""'}
- Skills: ${skills.length ? skills.join(', ') : 'None'}
- Education: ${JSON.stringify(resumeData.education)}
- Certificates: ${JSON.stringify(resumeData.certificates)}

Enhance summary and skills for a professional resume. Return only the JSON object.`;

      const raw = await generateGeminiResponse(prompt, undefined, undefined, geminiApiKey);
      const jsonStr = extractJson(raw);
      const parsed = JSON.parse(jsonStr) as { summary?: string; skills?: string[] };

      setResumeData((prev) => ({
        ...prev,
        summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : prev.summary,
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
          ? parsed.skills.filter((s): s is string => typeof s === 'string' && Boolean(s.trim()))
          : prev.skills,
      }));
      setShowFullPageResume(true);
    } catch (e) {
      console.error(e);
      alert('Failed to generate resume. Check your API key and try again.');
    } finally {
      setGeneratingResume(false);
    }
  };

  const isFresherResume = ['Beginner', 'Intermediate', 'Advanced', 'Fresher'].includes(resumeData.experienceLevel);
  const pageHeight = 297; // A4
  const margin = 18;
  const left = margin;
  const w = 210 - margin * 2;

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const maxY = pageHeight - 20;
    let yPos = 22;

    const checkNewPage = (needed: number) => {
      if (!isFresherResume && yPos + needed > maxY) {
        doc.addPage();
        yPos = 22;
      }
    };

    const sectionTitle = (title: string) => {
      checkNewPage(14);
      doc.setDrawColor(255, 107, 53);
      doc.setLineWidth(0.5);
      doc.line(left, yPos, left + 40, yPos);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(title, left, yPos + 5);
      yPos += isFresherResume ? 8 : 10;
    };

    // Header
    doc.setFontSize(isFresherResume ? 16 : 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(resumeData.personalInfo.name || 'Your Name', centerX, yPos, { align: 'center' });
    yPos += isFresherResume ? 5 : 7;

    doc.setFontSize(isFresherResume ? 9 : 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const contact = [
      resumeData.personalInfo.email,
      resumeData.personalInfo.phone,
      resumeData.personalInfo.location,
      resumeData.personalInfo.linkedin,
      resumeData.personalInfo.github,
    ].filter(Boolean);
    if (contact.length) {
      const contactStr = contact.join('  |  ');
      const contactLines = doc.splitTextToSize(contactStr, w);
      contactLines.forEach((line: string) => {
        doc.text(line, centerX, yPos, { align: 'center' });
        yPos += isFresherResume ? 4 : 5;
      });
      yPos += isFresherResume ? 4 : 6;
    }

    doc.setTextColor(40, 40, 40);

    if (resumeData.summary) {
      sectionTitle('PROFESSIONAL SUMMARY');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(isFresherResume ? 9 : 10);
      const lines = doc.splitTextToSize(resumeData.summary, w);
      lines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, left, yPos);
        yPos += isFresherResume ? 4 : 5;
      });
      yPos += isFresherResume ? 5 : 8;
    }

    sectionTitle('EXPERIENCE LEVEL');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isFresherResume ? 9 : 10);
    doc.text(resumeData.experienceLevel, left, yPos);
    yPos += isFresherResume ? 7 : 10;

    if (resumeData.experience.some((e) => e.title || e.company || e.duration || e.description)) {
      sectionTitle('EXPERIENCE');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(isFresherResume ? 9 : 10);
      resumeData.experience.forEach((exp) => {
        if (!exp.title && !exp.company && !exp.duration && !exp.description) return;
        checkNewPage(8);
        doc.setFont('helvetica', 'bold');
        doc.text(exp.title || 'Role', left, yPos);
        if (exp.duration) doc.text(exp.duration, left + w - doc.getTextWidth(exp.duration), yPos);
        yPos += isFresherResume ? 4 : 5;
        doc.setFont('helvetica', 'normal');
        if (exp.company) {
          checkNewPage(5);
          doc.text(exp.company, left, yPos);
          yPos += isFresherResume ? 4 : 5;
        }
        if (exp.description) {
          const descLines = doc.splitTextToSize(exp.description, w);
          descLines.forEach((line: string) => {
            checkNewPage(5);
            doc.text(line, left, yPos);
            yPos += isFresherResume ? 4 : 5;
          });
        }
        yPos += isFresherResume ? 3 : 5;
      });
      yPos += isFresherResume ? 3 : 5;
    }

    if (resumeData.skills.length > 0) {
      sectionTitle('SKILLS');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(isFresherResume ? 9 : 10);
      const skillList = resumeData.skills.filter((s) => s.trim());
      const skillsPerLine = 3;
      for (let i = 0; i < skillList.length; i += skillsPerLine) {
        const lineSkills = skillList.slice(i, i + skillsPerLine).join(', ');
        checkNewPage(5);
        doc.text(`• ${lineSkills}`, left, yPos);
        yPos += isFresherResume ? 4 : 5;
      }
      yPos += isFresherResume ? 5 : 8;
    }

    if (resumeData.education.some((e) => e.degree || e.institution || e.year)) {
      sectionTitle('EDUCATION');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(isFresherResume ? 9 : 10);
      resumeData.education.forEach((edu) => {
        if (edu.degree || edu.institution || edu.year) {
          checkNewPage(6);
          doc.text(`${edu.degree}${edu.institution ? `, ${edu.institution}` : ''}${edu.year ? ` • ${edu.year}` : ''}`, left, yPos);
          yPos += isFresherResume ? 5 : 6;
        }
      });
      yPos += isFresherResume ? 3 : 5;
    }

    if (resumeData.certificates.some((c) => c.name || c.issuer || c.year)) {
      sectionTitle('CERTIFICATES');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(isFresherResume ? 9 : 10);
      resumeData.certificates.forEach((c) => {
        if (c.name || c.issuer || c.year) {
          checkNewPage(6);
          doc.text(`${c.name}${c.issuer ? `, ${c.issuer}` : ''}${c.year ? ` • ${c.year}` : ''}`, left, yPos);
          yPos += isFresherResume ? 5 : 6;
        }
      });
    }

    doc.save('resume.pdf');
  };

  // Full-page resume view (after generation)
  if (showFullPageResume) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setShowFullPageResume(false)}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" /> Back to form
              </button>
              <div className="flex gap-3">
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white hover:bg-[#ff8c42]"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>
            </div>
            <div className={`overflow-hidden rounded-xl bg-white shadow-2xl ${isFresherResume ? 'max-w-3xl mx-auto' : ''}`}>
              <div className={`text-gray-900 ${isFresherResume ? 'p-6 md:p-10 max-h-[calc(100vh-12rem)]' : 'p-8 md:p-12'}`}>
                <div className="border-b border-gray-200 pb-5 mb-5">
                  <div className="flex items-start gap-4">
                    <div className="h-1 w-12 flex-shrink-0 rounded bg-[#ff6b35] mt-2" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                        {resumeData.personalInfo.name || 'Your Name'}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
                        {resumeData.personalInfo.phone && <span className="text-gray-400">|</span>}
                        {resumeData.personalInfo.phone && <span>{resumeData.personalInfo.phone}</span>}
                        {resumeData.personalInfo.location && <span className="text-gray-400">|</span>}
                        {resumeData.personalInfo.location && <span>{resumeData.personalInfo.location}</span>}
                        {resumeData.personalInfo.linkedin && (
                          <>
                            <span className="text-gray-400">|</span>
                            <a href={resumeData.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#ff6b35] hover:underline">LinkedIn</a>
                          </>
                        )}
                        {resumeData.personalInfo.github && (
                          <>
                            <span className="text-gray-400">|</span>
                            <a href={resumeData.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-[#ff6b35] hover:underline">GitHub</a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {resumeData.summary && (
                  <section className={isFresherResume ? 'mb-4' : 'mb-5'}>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff6b35] mb-1.5">Professional Summary</h2>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">{resumeData.summary}</p>
                  </section>
                )}

                <section className={isFresherResume ? 'mb-4' : 'mb-5'}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff6b35] mb-1.5">Experience Level</h2>
                  <p className="text-gray-800 font-medium">{resumeData.experienceLevel}</p>
                </section>

                {resumeData.experience.some((e) => e.title || e.company || e.duration || e.description) && (
                  <section className={isFresherResume ? 'mb-4' : 'mb-5'}>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff6b35] mb-1.5">Experience</h2>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, i) => {
                        if (!exp.title && !exp.company && !exp.duration && !exp.description) return null;
                        return (
                          <div key={i}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-semibold text-gray-900">{exp.title || 'Role'}</span>
                              {exp.duration && <span className="text-sm text-gray-600">{exp.duration}</span>}
                            </div>
                            {exp.company && <p className="text-sm text-gray-700 font-medium">{exp.company}</p>}
                            {exp.description && (
                              <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {resumeData.skills.length > 0 && (
                  <section className={isFresherResume ? 'mb-4' : 'mb-5'}>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff6b35] mb-1.5">Skills</h2>
                    <ul className="list-none space-y-1 pl-0">
                      {(() => {
                        const list = resumeData.skills.filter((s) => s.trim());
                        const perLine = 3;
                        const lines: string[][] = [];
                        for (let i = 0; i < list.length; i += perLine) lines.push(list.slice(i, i + perLine));
                        return lines.map((lineSkills, i) => (
                          <li key={i} className="flex items-baseline gap-2 text-sm md:text-base text-gray-800">
                            <span className="text-[#ff6b35] flex-shrink-0">•</span>
                            <span>{lineSkills.join(', ')}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </section>
                )}

                {resumeData.education.some((e) => e.degree || e.institution || e.year) && (
                  <section className={isFresherResume ? 'mb-4' : 'mb-5'}>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff6b35] mb-1.5">Education</h2>
                    <ul className="space-y-1.5">
                      {resumeData.education.map((edu, i) => {
                        if (!edu.degree && !edu.institution && !edu.year) return null;
                        return (
                          <li key={i} className="text-gray-700 text-sm md:text-base">
                            <span className="font-semibold text-gray-900">{edu.degree || '—'}</span>
                            {edu.institution && <span>, {edu.institution}</span>}
                            {edu.year && <span className="text-gray-600"> • {edu.year}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {resumeData.certificates.some((c) => c.name || c.issuer || c.year) && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff6b35] mb-1.5">Certificates</h2>
                    <ul className="space-y-1.5">
                      {resumeData.certificates.map((c, i) => {
                        if (!c.name && !c.issuer && !c.year) return null;
                        return (
                          <li key={i} className="text-gray-700 text-sm md:text-base">
                            <span className="font-semibold text-gray-900">{c.name || '—'}</span>
                            {c.issuer && <span>, {c.issuer}</span>}
                            {c.year && <span className="text-gray-600"> • {c.year}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main form view
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0f] py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <UserRound className="h-8 w-8 text-[#ff6b35]" />
              Resume Builder
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Fill the form below. Generate with AI then open your resume and download PDF.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur sm:p-8"
          >
            {/* Personal Information */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/70">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={resumeData.personalInfo.name}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/70">Email *</label>
                  <input
                    type="email"
                    required
                    value={resumeData.personalInfo.email}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/70">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={resumeData.personalInfo.phone}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                    placeholder="Phone"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/70">Location *</label>
                  <input
                    type="text"
                    required
                    value={resumeData.personalInfo.location}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/70">LinkedIn URL (optional)</label>
                  <input
                    type="url"
                    value={resumeData.personalInfo.linkedin}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, linkedin: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/70">GitHub URL (optional)</label>
                  <input
                    type="url"
                    value={resumeData.personalInfo.github}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, github: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-amber-400/90">
                Fill personal information fields above to enable AI resume generation.
              </p>
            </section>

            {/* Professional Summary */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Professional Summary</h2>
              <textarea
                value={resumeData.summary}
                onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                placeholder="Write a professional summary or use AI to generate one."
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!isPersonalInfoFilled || generatingSummary}
                  onClick={generateSummaryWithAI}
                  className="flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white hover:bg-[#ff8c42] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  {generatingSummary ? 'Generating…' : 'Generate with AI'}
                </button>
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {resumeData.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-[#ff6b35]/20 px-3 py-1 text-sm text-[#ffb26b]"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          skills: prev.skills.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={pendingSkill}
                onChange={(e) => setPendingSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = pendingSkill.trim();
                    if (val) {
                      setResumeData((prev) => ({
                        ...prev,
                        skills: Array.from(new Set([...prev.skills, ...val.split(',').map((s) => s.trim()).filter(Boolean)])),
                      }));
                      setPendingSkill('');
                    }
                  }
                }}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
                placeholder="Add skills (e.g., Python, Machine Learning, React…). Press Enter to add."
              />
            </section>

            {/* Experience Level */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Experience Level</h2>
              <select
                value={resumeData.experienceLevel}
                onChange={(e) =>
                  setResumeData((prev) => ({
                    ...prev,
                    experienceLevel: e.target.value as ExperienceLevel,
                  }))
                }
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              >
                {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-gray-900 text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </section>

            {/* Detailed Experience */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Detailed experience</h2>
                <button
                  type="button"
                  onClick={addExperience}
                  className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" /> Add experience
                </button>
              </div>
              <p className="text-xs text-white/60 mb-3">Add roles and describe what you did in each.</p>
              <div className="space-y-4">
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-white/70">Job title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const next = [...resumeData.experience];
                            next[index].title = e.target.value;
                            setResumeData((prev) => ({ ...prev, experience: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="e.g. Software Engineer"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const next = [...resumeData.experience];
                            next[index].company = e.target.value;
                            setResumeData((prev) => ({ ...prev, experience: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Duration</label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => {
                            const next = [...resumeData.experience];
                            next[index].duration = e.target.value;
                            setResumeData((prev) => ({ ...prev, experience: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="e.g. Jan 2022 – Present"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-white/70">What you did (responsibilities, achievements)</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => {
                            const next = [...resumeData.experience];
                            next[index].description = e.target.value;
                            setResumeData((prev) => ({ ...prev, experience: next }));
                          }}
                          rows={3}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="Describe your role, key tasks, and outcomes..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Education */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Education</h2>
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" /> Add Education
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const next = [...resumeData.education];
                            next[index].degree = e.target.value;
                            setResumeData((prev) => ({ ...prev, education: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="e.g. B.Tech"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">College / University</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const next = [...resumeData.education];
                            next[index].institution = e.target.value;
                            setResumeData((prev) => ({ ...prev, education: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="Institution name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Year</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={edu.year}
                          onChange={(e) => {
                            const next = [...resumeData.education];
                            next[index].year = e.target.value;
                            setResumeData((prev) => ({ ...prev, education: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="e.g. 2024"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Certificates */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Certificates</h2>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" /> Add Certificate
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.certificates.map((cert, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Certificate Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => {
                            const next = [...resumeData.certificates];
                            next[index].name = e.target.value;
                            setResumeData((prev) => ({ ...prev, certificates: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="e.g. AWS Certified"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Issuer</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => {
                            const next = [...resumeData.certificates];
                            next[index].issuer = e.target.value;
                            setResumeData((prev) => ({ ...prev, certificates: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="Issuing organization"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/70">Year</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cert.year}
                          onChange={(e) => {
                            const next = [...resumeData.certificates];
                            next[index].year = e.target.value;
                            setResumeData((prev) => ({ ...prev, certificates: next }));
                          }}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
                          placeholder="e.g. 2024"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <section className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={!isPersonalInfoFilled || generatingResume}
                onClick={generateResumeWithAI}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#ff6b35] px-6 py-3 font-medium text-white hover:bg-[#ff8c42] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-5 w-5" />
                {generatingResume ? 'Generating…' : 'Generate Resume with AI'}
              </button>
              <button
                type="button"
                onClick={exportToPDF}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10"
              >
                <Download className="h-5 w-5" />
                Download PDF
              </button>
            </section>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
