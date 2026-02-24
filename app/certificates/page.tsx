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
        courseName: 'Applied AI Engineer',
        completionDate: '2024-01-15',
        certificateId: 'AXEN-AI-ENG-2024-001',
        shareableLink: 'https://axen.app/cert/abc123',
      },
      {
        id: '2',
        courseName: 'AIML Engineer',
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
    const cx = width / 2;

    // Background
    doc.setFillColor(10, 17, 40);
    doc.rect(0, 0, width, height, 'F');

    // Outer decorative border (gold/orange)
    doc.setDrawColor(255, 107, 53);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, width - 16, height - 16);
    doc.setLineWidth(2);
    doc.rect(12, 12, width - 24, height - 24);

    // Inner border
    doc.setDrawColor(255, 140, 66);
    doc.setLineWidth(0.3);
    doc.rect(18, 18, width - 36, height - 36);

    // Corner ornaments (L-shaped accents)
    const cornerSize = 12;
    [[18, 18], [width - 18, 18], [width - 18, height - 18], [18, height - 18]].forEach(([x, y], i) => {
      doc.setDrawColor(255, 107, 53);
      doc.setLineWidth(1);
      const dx = i === 0 || i === 3 ? 1 : -1;
      const dy = i === 0 || i === 1 ? 1 : -1;
      doc.line(x, y, x + dx * cornerSize, y);
      doc.line(x, y, x, y + dy * cornerSize);
    });

    // Decorative seal/badge (left side)
    const sealX = 45;
    const sealY = height / 2 - 8;
    doc.setDrawColor(255, 107, 53);
    doc.setFillColor(40, 30, 20);
    doc.setLineWidth(1.5);
    doc.circle(sealX, sealY, 18, 'FD');
    doc.setDrawColor(255, 140, 66);
    doc.circle(sealX, sealY, 14, 'S');
    doc.setTextColor(255, 107, 53);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AXEN', sealX, sealY - 2, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('AI ACADEMY', sealX, sealY + 4, { align: 'center' });

    // Decorative seal/badge (right side)
    const sealX2 = width - 45;
    doc.setDrawColor(255, 107, 53);
    doc.setFillColor(40, 30, 20);
    doc.setLineWidth(1.5);
    doc.circle(sealX2, sealY, 18, 'FD');
    doc.setDrawColor(255, 140, 66);
    doc.circle(sealX2, sealY, 14, 'S');
    doc.setTextColor(255, 107, 53);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFIED', sealX2, sealY - 2, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPLETION', sealX2, sealY + 4, { align: 'center' });

    // Top decorative line
    doc.setDrawColor(200, 100, 60);
    doc.setLineWidth(0.5);
    doc.line(cx - 60, 42, cx + 60, 42);

    // Issuing authority
    doc.setTextColor(255, 140, 66);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('AXEN AI ACADEMY', cx, 35, { align: 'center' });

    // Title
    doc.setTextColor(255, 107, 53);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF COMPLETION', cx, 55, { align: 'center' });

    // Bottom decorative line under title
    doc.setDrawColor(220, 120, 70);
    doc.line(cx - 50, 62, cx + 50, 62);

    // Subtitle
    doc.setTextColor(200, 210, 230);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', cx, 82, { align: 'center' });

    // Recipient name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    const recipientName = user?.displayName || 'Student';
    doc.text(recipientName, cx, 98, { align: 'center' });

    // Course intro
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 230);
    doc.text('has successfully completed the course', cx, 112, { align: 'center' });

    // Course name (prominent)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 140, 66);
    doc.text(certificate.courseName, cx, 130, { align: 'center' });

    // Decorative line
    doc.setDrawColor(180, 90, 55);
    doc.line(cx - 40, 138, cx + 40, 138);

    // Date and ID box
    doc.setFillColor(30, 25, 20);
    doc.roundedRect(cx - 50, 148, 100, 20, 2, 2, 'FD');
    doc.setDrawColor(220, 120, 70);
    doc.roundedRect(cx - 50, 148, 100, 20, 2, 2, 'S');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 190, 210);
    doc.text(`Date: ${new Date(certificate.completionDate).toLocaleDateString()}`, cx, 157, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Certificate ID: ${certificate.certificateId}`, cx, 164, { align: 'center' });

    // Signature block
    doc.setDrawColor(200, 100, 60);
    doc.setLineWidth(0.5);
    doc.line(cx - 55, height - 38, cx - 25, height - 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 140, 66);
    doc.text('Authorized Signature', cx - 40, height - 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 170, 190);
    doc.text('Chief Learning Officer', cx - 40, height - 27, { align: 'center' });

    doc.line(cx + 25, height - 38, cx + 55, height - 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 140, 66);
    doc.text('Authorized Signature', cx + 40, height - 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 170, 190);
    doc.text('Director, Axen AI Academy', cx + 40, height - 27, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text('This certificate verifies successful course completion. Verify at axenai.in', cx, height - 12, { align: 'center' });

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

