'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Award, Download, Share2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// jsPDF will be dynamically imported

interface Certificate {
  id: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  shareableLink: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    // Mock data - replace with Firestore query in production
    setCertificates([
      {
        id: '1',
        courseName: 'AI Engineering Fundamentals',
        completionDate: '2024-01-15',
        certificateId: 'AXEN-AI-ENG-2024-001',
        shareableLink: 'https://axen.app/cert/abc123',
      },
      {
        id: '2',
        courseName: 'Machine Learning Mastery',
        completionDate: '2024-02-20',
        certificateId: 'AXEN-ML-2024-002',
        shareableLink: 'https://axen.app/cert/def456',
      },
    ]);
  };

  const generatePDF = async (certificate: Certificate) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(10, 17, 40);
    doc.rect(0, 0, width, height, 'F');

    // Border
    doc.setDrawColor(255, 107, 53);
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);

    // Title
    doc.setTextColor(255, 107, 53);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF COMPLETION', width / 2, 50, { align: 'center' });

    // Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', width / 2, 70, { align: 'center' });

    // Name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    doc.text(user?.displayName || 'Student', width / 2, 90, { align: 'center' });

    // Course
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`has successfully completed the course`, width / 2, 110, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    doc.text(certificate.courseName, width / 2, 130, { align: 'center' });

    // Date
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 174, 192);
    doc.text(`Date: ${new Date(certificate.completionDate).toLocaleDateString()}`, width / 2, 160, { align: 'center' });

    // Certificate ID
    doc.setFontSize(12);
    doc.text(`Certificate ID: ${certificate.certificateId}`, width / 2, 175, { align: 'center' });

    // Save
    doc.save(`certificate-${certificate.certificateId}.pdf`);
  };

  const copyShareableLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Shareable link copied to clipboard!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2 flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            My Certificates
          </h1>
          <p className="text-textSecondary">
            View and download your course completion certificates
          </p>
        </motion.div>

        {certificates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-black modern-card glow-border p-12 rounded-xl text-center"
          >
            <Award className="w-16 h-16 text-textSecondary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text mb-2">No Certificates Yet</h3>
            <p className="text-textSecondary">
              Complete courses to earn certificates
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black modern-card glow-border p-6 rounded-xl transition-all relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-text mb-2">{cert.courseName}</h3>
                    <p className="text-sm text-textSecondary">
                      Completed: {new Date(cert.completionDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-textSecondary mt-1">
                      ID: {cert.certificateId}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>

                <div className="flex gap-3 mt-6 relative z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      generatePDF(cert);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all relative z-20 cursor-pointer"
                    type="button"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      copyShareableLink(cert.shareableLink);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all relative z-20 cursor-pointer"
                    type="button"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

