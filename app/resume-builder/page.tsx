'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { UserRound, Download, Sparkles, Save, Plus, Trash2, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateGeminiResponse } from '@/lib/utils/gemini';
// jsPDF will be dynamically imported

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

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
    experience: [],
    education: [],
    skills: [],
    projects: [],
  });
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [apiKeyWarning, setApiKeyWarning] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<'fresher' | 'experienced'>('experienced');
  const [pendingSkill, setPendingSkill] = useState('');

  const personalInfoFields: Array<{
    key: keyof ResumeData['personalInfo'];
    label: string;
    type?: string;
    placeholder: string;
  }> = [
    { key: 'name', label: 'Full Name', placeholder: 'Full Name' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'Email' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: 'Phone' },
    { key: 'location', label: 'Location', placeholder: 'Location' },
    { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'LinkedIn URL' },
    { key: 'github', label: 'GitHub URL', placeholder: 'GitHub URL' },
  ];

  const canUseAI = useMemo(() => Boolean(geminiApiKey) && generatingSection === null, [geminiApiKey, generatingSection]);
  const isResumeReady = useMemo(() => {
    const { personalInfo } = resumeData;
    return Boolean(
      personalInfo.name &&
      personalInfo.email &&
      personalInfo.phone &&
      personalInfo.location &&
      personalInfo.linkedin &&
      personalInfo.github
    );
  }, [resumeData]);

  const experienceComplete = useMemo(() => {
    if (experienceLevel === 'fresher') return true;
    return (
      resumeData.experience.length > 0 &&
      resumeData.experience.every(
        (exp) => exp.title && exp.company && exp.duration && exp.description
      )
    );
  }, [resumeData.experience, experienceLevel]);

  const educationComplete = useMemo(
    () =>
      resumeData.education.length > 0 &&
      resumeData.education.every((edu) => edu.degree && edu.institution && edu.year),
    [resumeData.education]
  );

  const skillsComplete = useMemo(
    () => resumeData.skills.length > 0 || pendingSkill.trim().length > 0,
    [resumeData.skills, pendingSkill]
  );

  const projectsComplete = useMemo(
    () =>
      resumeData.projects.length > 0 &&
      resumeData.projects.every((proj) => proj.name && proj.description),
    [resumeData.projects]
  );

  const missingSections = useMemo(() => {
    const missing: string[] = [];
    if (!isResumeReady) missing.push('personal information');
    if (!skillsComplete) missing.push('skills');
    if (!educationComplete) missing.push('education');
    if (!projectsComplete) missing.push('projects');
    if (!experienceComplete) missing.push('experience');
    return missing;
  }, [isResumeReady, skillsComplete, educationComplete, projectsComplete, experienceComplete]);

  const canGenerateFullResume = useMemo(
    () =>
      Boolean(geminiApiKey) &&
      generatingSection === null &&
      missingSections.length === 0,
    [geminiApiKey, generatingSection, missingSections.length]
  );

  const commitPendingSkill = (snapshot: ResumeData): ResumeData => {
    if (!pendingSkill.trim()) {
      return snapshot;
    }
    const newSkills = [
      ...snapshot.skills,
      ...pendingSkill
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    ];
    setPendingSkill('');
    const uniqueSkills = Array.from(new Set(newSkills));
    const updated = { ...snapshot, skills: uniqueSkills };
    setResumeData(updated);
    return updated;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadGeminiKey = () => {
      if (!user?.uid) {
        setApiKeyWarning('Add your Gemini API key in the API Integration tab to use AI generation.');
      }

      const tryParseKeys = (storageKey: string) => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        try {
          const stored = JSON.parse(raw) as Array<{ service: string; key: string }>;
          return (
            stored.find((entry) =>
              entry.service.toLowerCase().includes('gemini') ||
              entry.service.toLowerCase().includes('google')
            )?.key ?? null
          );
        } catch (error) {
          console.error('Failed to parse API keys from storage key:', storageKey, error);
          return null;
        }
      };

      // Try user-specific key first
      if (user?.uid) {
        const key = tryParseKeys(`apiKeys_${user.uid}`);
        if (key) {
          setGeminiApiKey(key);
          setApiKeyWarning(null);
          return;
        }
      }

      // Fallback: search all apiKeys_* entries
      for (let i = 0; i < localStorage.length; i += 1) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith('apiKeys_')) {
          const key = tryParseKeys(storageKey);
          if (key) {
            setGeminiApiKey(key);
            setApiKeyWarning(null);
            return;
          }
        }
      }

      setGeminiApiKey(null);
      setApiKeyWarning('Gemini API key not found. Add a key (service name "Gemini" or "Google") in the API Integration tab to enable AI generation.');
    };

    loadGeminiKey();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('apiKeys_')) {
        loadGeminiKey();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const extractJson = (raw: string) => {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return raw.slice(firstBrace, lastBrace + 1);
    }
    return raw.trim();
  };

  const generateWithAI = async (section: string) => {
    if (!geminiApiKey) {
      alert('Gemini API key not found. Add your Gemini API key (service: "Gemini" or "Google") in the API Integration tab to use AI generation.');
      return;
    }

    setGeneratingSection(section);
    try {
      const prompt = `Generate professional ${section} content for an ${experienceLevel === 'fresher' ? 'entry-level' : 'experienced'} AI/ML engineer resume. Return only the content, no explanations. Make it concise and impactful.`;
      const content = await generateGeminiResponse(prompt, undefined, undefined, geminiApiKey);
      
      if (section === 'summary') {
        setResumeData({ ...resumeData, summary: content });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate content. Please check your Gemini API key.';
      alert(message);
    } finally {
      setGeneratingSection((prev) => (prev === section ? null : prev));
    }
  };

  const generateFullResume = async () => {
    if (!geminiApiKey) {
      alert('Gemini API key not found. Add your Gemini API key (service: "Gemini" or "Google") in the API Integration tab to use AI generation.');
      return;
    }
    if (missingSections.length > 0) {
      alert(`Please complete the following before generating the full resume: ${missingSections.join(', ')}.`);
      return;
    }

    const workingData = commitPendingSkill(resumeData);

    setGeneratingSection('full');
    try {
      const prompt = `You are an expert AI resume writer. Using the following user-provided details, generate a polished ${experienceLevel === 'fresher' ? 'entry-level' : 'experienced'} AI/ML engineer resume.
Return ONLY valid JSON matching this TypeScript interface:
{
  "summary": string,
  "skills": string[],
  "experience": Array<{ "title": string, "company": string, "duration": string, "description": string }>,
  "education": Array<{ "degree": string, "institution": string, "year": string }>,
  "projects": Array<{ "name": string, "description": string, "technologies": string[] }>
}

User data (fill in missing gaps, rewrite and enhance existing content where provided):
Personal info: ${JSON.stringify(workingData.personalInfo, null, 2)}
Current summary: ${workingData.summary || '""'}
Skills: ${workingData.skills.length ? workingData.skills.join(', ') : 'None provided'}
Experience entries: ${workingData.experience.length ? JSON.stringify(workingData.experience, null, 2) : 'None provided'}
Education entries: ${workingData.education.length ? JSON.stringify(workingData.education, null, 2) : 'None provided'}
Projects: ${workingData.projects.length ? JSON.stringify(workingData.projects, null, 2) : 'None provided'}

Rules:
- Tailor the content for AI/ML engineering roles.
- Keep experience bullet descriptions concise but impactful.
- For missing fields, craft realistic entries aligned with AI/ML skills.
- Never include Markdown fencing or commentary—JSON only.`;

      const raw = await generateGeminiResponse(prompt, undefined, undefined, geminiApiKey);
      console.debug('[Resume Builder] Gemini raw response:', raw);
      const jsonPayload = extractJson(raw);
      console.debug('[Resume Builder] Extracted JSON payload:', jsonPayload);
      let parsed: any;
      try {
        parsed = JSON.parse(jsonPayload);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON:', parseError);
        alert('Gemini returned data in an unexpected format. Please try again.\n\nRaw response:\n' + raw);
        return;
      }

      const normalisedProjects = Array.isArray(parsed.projects)
        ? parsed.projects.map((proj: any) => ({
            name: String(proj?.name ?? '').trim(),
            description: String(proj?.description ?? '').trim(),
            technologies: Array.isArray(proj?.technologies)
              ? proj.technologies.filter((tech: any) => typeof tech === 'string' && tech.trim())
              : typeof proj?.technologies === 'string'
                ? proj.technologies
                    .split(',')
                    .map((tech: string) => tech.trim())
                    .filter(Boolean)
                : [],
          }))
        : null;

      const normalisedExperience = Array.isArray(parsed.experience)
        ? parsed.experience.map((exp: any) => ({
            title: String(exp?.title ?? '').trim(),
            company: String(exp?.company ?? '').trim(),
            duration: String(exp?.duration ?? '').trim(),
            description: String(exp?.description ?? '').trim(),
          }))
        : null;

      const normalisedEducation = Array.isArray(parsed.education)
        ? parsed.education.map((edu: any) => ({
            degree: String(edu?.degree ?? '').trim(),
            institution: String(edu?.institution ?? '').trim(),
            year: String(edu?.year ?? '').trim(),
          }))
        : null;

      const normalisedSkills = Array.isArray(parsed.skills)
        ? parsed.skills.filter((skill: any) => typeof skill === 'string' && skill.trim())
        : typeof parsed.skills === 'string'
          ? parsed.skills
              .split(',')
              .map((skill: string) => skill.trim())
              .filter(Boolean)
          : null;

      setResumeData((prev) => ({
        ...prev,
        summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : prev.summary,
        skills: normalisedSkills && normalisedSkills.length > 0 ? normalisedSkills : prev.skills,
        experience: normalisedExperience && normalisedExperience.length > 0 ? normalisedExperience : prev.experience,
        education: normalisedEducation && normalisedEducation.length > 0 ? normalisedEducation : prev.education,
        projects: normalisedProjects && normalisedProjects.length > 0 ? normalisedProjects : prev.projects,
      }));
    } catch (error) {
      console.error('Full resume generation failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate resume content. Please verify your Gemini API key and try again.';
      alert(message);
    } finally {
      setGeneratingSection((prev) => (prev === 'full' ? null : prev));
    }
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    let yPos = 25;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    doc.text(resumeData.personalInfo.name || 'Your Name', centerX, yPos, { align: 'center' });
    yPos += 10;

    // Contact Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const contactSegments = [
      resumeData.personalInfo.email,
      resumeData.personalInfo.phone,
      resumeData.personalInfo.location,
      resumeData.personalInfo.linkedin,
      resumeData.personalInfo.github,
    ].filter(Boolean);
    if (contactSegments.length > 0) {
      const contactInfo = contactSegments.join(' | ');
      const contactLines = doc.splitTextToSize(contactInfo, 180);
      contactLines.forEach((line: string) => {
        doc.text(line, centerX, yPos, { align: 'center' });
        yPos += 6;
      });
    } else {
      yPos += 6;
    }
    yPos += 6;

    // Summary
    if (resumeData.summary) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Professional Summary', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(resumeData.summary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 5 + 10;
    }

    // Skills
    if (resumeData.skills.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Skills', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(resumeData.skills.join(', '), 20, yPos);
      yPos += 10;
    }

    // Experience
    if (resumeData.experience.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Experience', 20, yPos);
      yPos += 8;
      resumeData.experience.forEach((exp) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(exp.title, 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${exp.company} | ${exp.duration}`, 20, yPos);
        yPos += 6;
        const descLines = doc.splitTextToSize(exp.description, 170);
        doc.text(descLines, 20, yPos);
        yPos += descLines.length * 5 + 5;
      });
    }

    // Education
    if (resumeData.education.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Education', 20, yPos);
      yPos += 8;
      resumeData.education.forEach((edu) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(edu.degree, 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${edu.institution} | ${edu.year}`, 20, yPos);
        yPos += 10;
      });
    }

    // Projects
    if (resumeData.projects.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Projects', 20, yPos);
      yPos += 8;
      resumeData.projects.forEach((proj) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(proj.name, 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(proj.description, 170);
        doc.text(descLines, 20, yPos);
        yPos += descLines.length * 5 + 5;
        if (proj.technologies.length > 0) {
          doc.text(`Technologies: ${proj.technologies.join(', ')}`, 20, yPos);
          yPos += 6;
        }
        yPos += 3;
      });
    }

    doc.save('resume.pdf');
  };

  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [...resumeData.experience, { title: '', company: '', duration: '', description: '' }],
    });
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [...resumeData.education, { degree: '', institution: '', year: '' }],
    });
  };

  const addProject = () => {
    setResumeData({
      ...resumeData,
      projects: [...resumeData.projects, { name: '', description: '', technologies: [] }],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-title mb-2 flex items-center gap-3">
            <UserRound className="w-8 h-8 text-primary" />
            Resume Builder
          </h1>
          <p className="text-body">
            Create a professional AI/ML engineer resume with AI assistance
          </p>
          {apiKeyWarning && (
            <div className="mt-4 p-3 bg-yellow-500/15 border border-yellow-500/40 rounded-lg text-sm text-yellow-200">
              {apiKeyWarning}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
              <h2 className="text-section mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {personalInfoFields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-2 relative z-10">
                    <label className="text-caption text-textSecondary uppercase tracking-wide">
                      {field.label}
                      <span className="text-primary ml-1">*</span>
                    </label>
                    <input
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      value={resumeData.personalInfo[field.key] || ''}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          personalInfo: { ...resumeData.personalInfo, [field.key]: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-card text-text rounded-lg border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all relative z-20"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                ))}
              </div>
              {!isResumeReady && (
                <p className="mt-4 text-caption text-yellow-400">
                  Please fill in all personal information fields above to enable AI resume generation.
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Professional Summary</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    generateWithAI('summary');
                  }}
                  disabled={!geminiApiKey || generatingSection !== null}
                  title={geminiApiKey ? undefined : 'Add your Gemini API key in API Integration to enable AI generation'}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 relative z-20 cursor-pointer ${
                    geminiApiKey
                      ? 'bg-primary hover:bg-primary/90 text-white disabled:opacity-50'
                      : 'bg-card text-text opacity-70 cursor-not-allowed'
                  }`}
                  type="button"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingSection === 'summary' ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                placeholder="Write a professional summary or use AI to generate one"
                className="w-full h-32 px-4 py-2 bg-card text-text rounded-lg relative z-10"
                style={{ pointerEvents: 'auto' }}
              />
            </div>

            {/* Skills */}
            <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
              <h2 className="text-section mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {resumeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-caption flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newSkills = resumeData.skills.filter((_, i) => i !== index);
                        setResumeData({ ...resumeData, skills: newSkills });
                      }}
                      className="hover:text-red-400 relative z-20 cursor-pointer"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add skill and press Enter"
                value={pendingSkill}
                onChange={(e) => setPendingSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const entries = pendingSkill
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean);
                    if (entries.length > 0) {
                      const unique = Array.from(
                        new Set([...resumeData.skills, ...entries])
                      );
                      setResumeData({ ...resumeData, skills: unique });
                      setPendingSkill('');
                    }
                  }
                }}
                onBlur={() => {
                  const trimmed = pendingSkill.trim();
                  if (trimmed) {
                    const entries = trimmed
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean);
                    if (entries.length > 0) {
                      const unique = Array.from(
                        new Set([...resumeData.skills, ...entries])
                      );
                      setResumeData({ ...resumeData, skills: unique });
                    }
                    setPendingSkill('');
                  }
                }}
                className="w-full px-4 py-2 bg-card text-text rounded-lg border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all relative z-10"
                style={{ pointerEvents: 'auto' }}
              />
            </div>

            {/* Experience */}
            <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Experience</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addExperience();
                  }}
                  className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all flex items-center gap-2 relative z-20 cursor-pointer"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <span className="text-caption uppercase tracking-wide text-textSecondary">Experience Level:</span>
                <div className="flex gap-2 relative z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExperienceLevel('fresher');
                    }}
                    className={`px-3 py-1 rounded-lg text-caption transition-all relative z-20 cursor-pointer ${experienceLevel === 'fresher' ? 'bg-primary text-white' : 'bg-card text-text hover:bg-card/80'}`}
                    type="button"
                  >
                    Fresher
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExperienceLevel('experienced');
                    }}
                    className={`px-3 py-1 rounded-lg text-caption transition-all relative z-20 cursor-pointer ${experienceLevel === 'experienced' ? 'bg-primary text-white' : 'bg-card text-text hover:bg-card/80'}`}
                    type="button"
                  >
                    Experienced
                  </button>
                </div>
              </div>
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-card/50 rounded-lg space-y-3 relative">
                    <div className="flex justify-end relative z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newExp = resumeData.experience.filter((_, i) => i !== index);
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        className="text-red-400 hover:text-red-500 relative z-20 cursor-pointer"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) => {
                        const newExp = [...resumeData.experience];
                        newExp[index].title = e.target.value;
                        setResumeData({ ...resumeData, experience: newExp });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...resumeData.experience];
                          newExp[index].company = e.target.value;
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                        value={exp.duration}
                        onChange={(e) => {
                          const newExp = [...resumeData.experience];
                          newExp[index].duration = e.target.value;
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                    <textarea
                      placeholder="Job description"
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...resumeData.experience];
                        newExp[index].description = e.target.value;
                        setResumeData({ ...resumeData, experience: newExp });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded h-24 relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Education</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addEducation();
                  }}
                  className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all flex items-center gap-2 relative z-20 cursor-pointer"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="p-4 bg-card/50 rounded-lg space-y-3 relative">
                    <div className="flex justify-end relative z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newEdu = resumeData.education.filter((_, i) => i !== index);
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        className="text-red-400 hover:text-red-500 relative z-20 cursor-pointer"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...resumeData.education];
                        newEdu[index].degree = e.target.value;
                        setResumeData({ ...resumeData, education: newEdu });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...resumeData.education];
                          newEdu[index].institution = e.target.value;
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <input
                        type="text"
                        placeholder="Year"
                        value={edu.year}
                        onChange={(e) => {
                          const newEdu = [...resumeData.education];
                          newEdu[index].year = e.target.value;
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Projects</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addProject();
                  }}
                  className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all flex items-center gap-2 relative z-20 cursor-pointer"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.projects.map((proj, index) => (
                  <div key={index} className="p-4 bg-card/50 rounded-lg space-y-3 relative">
                    <div className="flex justify-end relative z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newProj = resumeData.projects.filter((_, i) => i !== index);
                          setResumeData({ ...resumeData, projects: newProj });
                        }}
                        className="text-red-400 hover:text-red-500 relative z-20 cursor-pointer"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={proj.name}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[index].name = e.target.value;
                        setResumeData({ ...resumeData, projects: newProj });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                    <textarea
                      placeholder="Project description"
                      value={proj.description}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[index].description = e.target.value;
                        setResumeData({ ...resumeData, projects: newProj });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded h-24 relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                    <input
                      type="text"
                      placeholder="Technologies (comma separated)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          const newProj = [...resumeData.projects];
                          newProj[index].technologies = e.currentTarget.value.split(',').map(t => t.trim());
                          setResumeData({ ...resumeData, projects: newProj });
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Full Resume Generation */}
          <div className="bg-black modern-card glow-border p-6 rounded-xl relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-section mb-2 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  AI Resume Draft
                </h2>
                <p className="text-body">
                  Let Gemini craft a complete resume from your details. Review and tweak the generated content before exporting.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  generateFullResume();
                }}
                disabled={!canGenerateFullResume}
                title={
                  !geminiApiKey
                    ? 'Add your Gemini API key in API Integration to enable AI generation'
                    : missingSections.length > 0
                    ? `Complete: ${missingSections.join(', ')}`
                    : undefined
                }
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 relative z-20 cursor-pointer ${
                  canGenerateFullResume
                    ? 'bg-primary hover:bg-primary/90 text-white disabled:opacity-50'
                    : 'bg-card text-text opacity-70 cursor-not-allowed'
                }`}
                type="button"
              >
                <Bot className="w-4 h-4" />
                {generatingSection === 'full' ? 'Generating...' : 'Generate Full Resume'}
              </button>
            </div>
            {missingSections.length > 0 && (
              <p className="mt-4 text-caption text-yellow-400">
                Complete the following sections before generating: {missingSections.join(', ')}.
              </p>
            )}
          </div>

          {/* Preview & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-black modern-card glow-border p-6 rounded-xl sticky top-4 relative">
              <h2 className="text-section mb-4">Actions</h2>
              <div className="space-y-3 relative z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    exportToPDF();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all relative z-20 cursor-pointer"
                  type="button"
                >
                  <Download className="w-5 h-5" />
                  Export to PDF
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    localStorage.setItem('resumeData', JSON.stringify(resumeData));
                    alert('Resume saved!');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-card/80 text-text rounded-lg transition-all relative z-20 cursor-pointer"
                  type="button"
                >
                  <Save className="w-5 h-5" />
                  Save Resume
                </button>
              </div>

              <div className="mt-6 p-4 bg-card/50 rounded-lg relative z-10">
                <h3 className="text-section mb-2">Templates</h3>
                <div className="space-y-2">
                  {['modern', 'classic', 'creative'].map((template) => (
                    <button
                      key={template}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedTemplate(template);
                      }}
                      className={`w-full text-left px-3 py-2 rounded relative z-20 cursor-pointer ${
                        selectedTemplate === template
                          ? 'bg-primary text-white'
                          : 'bg-card text-text hover:bg-card/80'
                      }`}
                      type="button"
                    >
                      {template.charAt(0).toUpperCase() + template.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

