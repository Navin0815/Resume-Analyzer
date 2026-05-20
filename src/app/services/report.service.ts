import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ResumeAnalysis } from '../interfaces/resume-analysis';

@Injectable({ providedIn: 'root' })
export class ReportService {
  downloadAnalysisReport(fileName: string, analysis: ResumeAnalysis): void {
    const document = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;

    document.setFont('helvetica', 'bold');
    document.setFontSize(20);
    document.text('AI Resume Analyzer Report', margin, y);
    y += 28;

    document.setFont('helvetica', 'normal');
    document.setFontSize(10);
    document.text(`Resume: ${fileName}`, margin, y);
    y += 18;
    document.text(`Resume Score: ${analysis.resumeScore}/100 | ATS Score: ${analysis.atsScore}/100`, margin, y);
    y += 28;

    y = this.addSection(document, 'Summary', [analysis.summary], margin, y);
    y = this.addSection(document, 'Technical Skills Found', analysis.technicalSkillsFound, margin, y);
    y = this.addSection(document, 'Missing Important Skills', analysis.missingImportantSkills, margin, y);
    y = this.addSection(document, 'ATS Optimization Suggestions', analysis.atsOptimizationSuggestions, margin, y);
    y = this.addSection(document, 'Resume Improvement Recommendations', analysis.resumeImprovementRecommendations, margin, y);
    y = this.addSection(document, 'Career Suggestions', analysis.careerSuggestions, margin, y);
    y = this.addSection(document, 'Strengths', analysis.strengths, margin, y);
    this.addSection(document, 'Weaknesses', analysis.weaknesses, margin, y);

    const safeName = fileName.replace(/\.pdf$/i, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    document.save(`${safeName || 'resume'}-ai-analysis.pdf`);
  }

  private addSection(document: jsPDF, title: string, items: string[], margin: number, startY: number): number {
    let y = this.ensureSpace(document, startY, 70, margin);

    document.setFont('helvetica', 'bold');
    document.setFontSize(13);
    document.text(title, margin, y);
    y += 18;

    document.setFont('helvetica', 'normal');
    document.setFontSize(10);

    const safeItems = items.length ? items : ['No items returned.'];

    for (const item of safeItems) {
      const lines = document.splitTextToSize(`- ${item}`, 500) as string[];
      y = this.ensureSpace(document, y, lines.length * 13 + 10, margin);
      document.text(lines, margin, y);
      y += lines.length * 13 + 8;
    }

    return y + 8;
  }

  private ensureSpace(document: jsPDF, y: number, neededSpace: number, margin: number): number {
    if (y + neededSpace < document.internal.pageSize.getHeight() - margin) {
      return y;
    }

    document.addPage();
    return margin;
  }
}
