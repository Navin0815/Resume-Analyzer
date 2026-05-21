import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AnalysisDashboardComponent } from '../../components/analysis-dashboard/analysis-dashboard';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { ResumePreviewComponent } from '../../components/resume-preview/resume-preview';
import { UploadResumeComponent } from '../../components/upload-resume/upload-resume';
import { JobDescriptionInputComponent } from '../../components/job-description-input/job-description-input';
import { JdComparisonDashboardComponent } from '../../components/jd-comparison-dashboard/jd-comparison-dashboard';
import { MultiJobHistoryComponent } from '../../components/multi-job-history/multi-job-history';
import { ResumeAnalysis, ResumeHistoryItem, ATSScore, JobDescription, JDHistoryItem } from '../../interfaces/resume-analysis';
import { AiService } from '../../services/ai.service';
import { AtsService } from '../../services/ats.service';
import { JdAnalysisService } from '../../services/jd-analysis.service';
import { PdfService } from '../../services/pdf.service';
import { ReportService } from '../../services/report.service';

const historyStorageKey = 'ai-resume-analyzer-history';
const jdHistoryStorageKey = 'ai-resume-analyzer-jd-history';

@Component({
  selector: 'app-home',
  imports: [
    AnalysisDashboardComponent,
    CommonModule,
    JdComparisonDashboardComponent,
    JobDescriptionInputComponent,
    LoadingSpinnerComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MultiJobHistoryComponent,
    ResumePreviewComponent,
    UploadResumeComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly aiService = inject(AiService);
  private readonly atsService = inject(AtsService);
  private readonly jdAnalysisService = inject(JdAnalysisService);
  private readonly pdfService = inject(PdfService);
  private readonly reportService = inject(ReportService);
  private readonly snackBar = inject(MatSnackBar);
  private progressTimer: number | undefined;
  private lastSelectedFile: File | null = null;

  protected readonly selectedFileName = signal('');
  protected readonly resumeText = signal('');
  protected readonly analysis = signal<ResumeAnalysis | null>(null);
  protected readonly jobDescriptionText = signal('');
  protected readonly jobDescription = signal<JobDescription | null>(null);
  protected readonly atsScore = signal<ATSScore | null>(null);
  protected readonly loading = signal(false);
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly history = signal<ResumeHistoryItem[]>(this.loadHistory());
  protected readonly jdHistory = signal<JDHistoryItem[]>(this.loadJdHistory());
  protected readonly apiKeyConfigured = signal(this.aiService.hasApiKey());

  async analyzeFile(file: File): Promise<void> {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.error.set('Please upload a valid PDF resume.');
      this.snackBar.open('Only PDF resumes are supported.', 'Close', { duration: 3500 });
      return;
    }

    this.lastSelectedFile = file;
    this.resetForAnalysis(file.name);
    this.startProgressAnimation();

    try {
      const text = await this.pdfService.extractTextFromPdf(file);
      this.resumeText.set(text);
      this.progress.set(45);

      const result = await this.aiService.analyzeResume(text);
      this.analysis.set(result);
      this.progress.set(100);
      this.saveHistory(file.name, text, result);
      this.snackBar.open('Resume analysis completed.', 'Close', { duration: 3000 });
    } catch (error) {
      const message = this.toUserFriendlyError(error);
      this.error.set(message);
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.stopProgressAnimation();
      this.loading.set(false);
    }
  }

  protected retryAnalysis(): void {
    if (!this.lastSelectedFile || this.loading()) {
      return;
    }

    void this.analyzeFile(this.lastSelectedFile);
  }

  protected saveGroqApiKey(apiKey: string): void {
    try {
      this.aiService.saveBrowserApiKey(apiKey);
      this.apiKeyConfigured.set(true);
      this.error.set(null);
      this.snackBar.open('Groq API key saved in this browser.', 'Close', { duration: 3000 });
    } catch (error) {
      const message = this.toUserFriendlyError(error);
      this.snackBar.open(message, 'Close', { duration: 4000 });
    }
  }

  protected clearGroqApiKey(): void {
    this.aiService.clearBrowserApiKey();
    this.apiKeyConfigured.set(this.aiService.hasApiKey());
    this.snackBar.open('Saved Groq API key cleared from this browser.', 'Close', { duration: 3000 });
  }

  protected restoreHistory(item: ResumeHistoryItem): void {
    this.selectedFileName.set(item.fileName);
    this.resumeText.set(item.resumeText);
    this.analysis.set(item.analysis);
    this.error.set(null);
    this.progress.set(100);
  }

  protected updateJobDescription(text: string): void {
    this.jobDescriptionText.set(text);
    this.jobDescription.set({
      id: this.jobDescription()?.id || this.createHistoryId(),
      title: this.jobDescription()?.title || 'Target Job',
      company: this.jobDescription()?.company || '',
      text,
      source: 'text',
      extractedAt: new Date().toISOString(),
      requirements: this.jobDescription()?.requirements,
    });
  }

  protected async compareWithJobDescription(): Promise<void> {
    const resume = this.resumeText().trim();
    const jdText = this.jobDescriptionText().trim();

    if (!resume) {
      this.error.set('Upload and extract a resume before comparing against a job description.');
      this.snackBar.open('Please upload a resume first.', 'Close', { duration: 3500 });
      return;
    }

    if (jdText.length < 100) {
      this.error.set('Please provide a job description with at least 100 characters.');
      this.snackBar.open('Job description is too short.', 'Close', { duration: 3500 });
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.progress.set(10);
    this.startProgressAnimation();

    try {
      const jdRequirements = await this.jdAnalysisService.analyzeJobDescription(jdText);
      const jobDescription: JobDescription = {
        id: this.jobDescription()?.id || this.createHistoryId(),
        title: this.jobDescription()?.title || jdRequirements.roleType || 'Target Job',
        company: this.jobDescription()?.company || '',
        text: jdText,
        source: this.jobDescription()?.source || 'text',
        extractedAt: new Date().toISOString(),
        requirements: jdRequirements,
      };

      this.jobDescription.set(jobDescription);
      this.progress.set(45);

      const comparison = await this.atsService.compareResumeToJD(resume, jdText, jdRequirements);
      const optimizedResume = await this.atsService.optimizeResume(resume, jdText, jdRequirements);

      const atsScore: ATSScore = {
        id: this.createHistoryId(),
        jobDescriptionId: jobDescription.id,
        jobTitle: jobDescription.title,
        resumeMatchPercentage: comparison.resumeMatchPercentage,
        atsCompatibilityScore: comparison.atsCompatibilityScore,
        skillMatchPercentage: comparison.skillMatchPercentage,
        overallScore: Math.round((comparison.resumeMatchPercentage + comparison.atsCompatibilityScore + comparison.skillMatchPercentage) / 3),
        details: {
          resumeText: resume,
          jdText,
          matchedSkills: comparison.matchedSkills,
          missingSkills: comparison.missingSkills,
          matchedKeywords: comparison.matchedKeywords,
          missingKeywords: comparison.missingKeywords,
          atsIssues: comparison.atsIssues,
          atsRecommendations: comparison.atsRecommendations,
        },
        optimizedResume,
        analyzedAt: new Date().toISOString(),
      };

      this.atsScore.set(atsScore);
      this.progress.set(100);
      this.saveJdHistory(jobDescription, atsScore);
      this.snackBar.open('ATS comparison completed.', 'Close', { duration: 3000 });
    } catch (error) {
      const message = this.toUserFriendlyError(error);
      this.error.set(message);
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.stopProgressAnimation();
      this.loading.set(false);
    }
  }

  protected clearJobDescription(): void {
    this.jobDescriptionText.set('');
    this.jobDescription.set(null);
    this.atsScore.set(null);
    this.error.set(null);
  }

  protected restoreJdHistory(item: JDHistoryItem): void {
    this.jobDescription.set(item.jobDescription);
    this.jobDescriptionText.set(item.jobDescription.text);
    this.atsScore.set(item.atsScore);
    this.error.set(null);
    this.progress.set(100);
  }

  protected clearJdHistory(): void {
    this.jdHistory.set([]);

    if (this.hasLocalStorage()) {
      localStorage.removeItem(jdHistoryStorageKey);
    }

    this.snackBar.open('ATS comparison history cleared.', 'Close', { duration: 2500 });
  }

  protected downloadAtsReport(): void {
    const result = this.atsScore();

    if (!result) {
      return;
    }

    this.reportService.downloadAtsAnalysisReport(this.selectedFileName() || 'resume.pdf', result);
  }

  protected downloadOptimizedResume(): void {
    const result = this.atsScore();

    if (!result?.optimizedResume.atsOptimizedContent) {
      return;
    }

    const blob = new Blob([result.optimizedResume.atsOptimizedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.selectedFileName().replace(/\.pdf$/i, '') || 'resume'}-optimized.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected clearHistory(): void {
    this.history.set([]);

    if (this.hasLocalStorage()) {
      localStorage.removeItem(historyStorageKey);
    }

    this.snackBar.open('Resume history cleared.', 'Close', { duration: 2500 });
  }

  protected copySuggestions(): void {
    const result = this.analysis();

    if (!result) {
      return;
    }

    const text = [
      'ATS Optimization Suggestions',
      ...result.atsOptimizationSuggestions.map((item) => `- ${item}`),
      '',
      'Resume Improvement Recommendations',
      ...result.resumeImprovementRecommendations.map((item) => `- ${item}`),
      '',
      'Missing Important Skills',
      ...result.missingImportantSkills.map((item) => `- ${item}`),
    ].join('\n');

    if (!navigator.clipboard) {
      this.snackBar.open('Clipboard is not available in this browser.', 'Close', { duration: 3500 });
      return;
    }

    void navigator.clipboard
      .writeText(text)
      .then(() => {
        this.snackBar.open('Suggestions copied.', 'Close', { duration: 2500 });
      })
      .catch(() => {
        this.snackBar.open('Could not copy suggestions. Please try again.', 'Close', { duration: 3500 });
      });
  }

  protected downloadReport(): void {
    const result = this.analysis();

    if (result) {
      this.reportService.downloadAnalysisReport(this.selectedFileName() || 'resume.pdf', result);
    }
  }

  private resetForAnalysis(fileName: string): void {
    this.selectedFileName.set(fileName);
    this.resumeText.set('');
    this.analysis.set(null);
    this.error.set(null);
    this.loading.set(true);
    this.progress.set(8);
  }

  private startProgressAnimation(): void {
    this.stopProgressAnimation();
    this.progressTimer = window.setInterval(() => {
      this.progress.update((value) => (value < 90 ? value + 4 : value));
    }, 450);
  }

  private stopProgressAnimation(): void {
    if (this.progressTimer) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
  }

  private saveHistory(fileName: string, resumeText: string, analysis: ResumeAnalysis): void {
    const historyItem: ResumeHistoryItem = {
      id: this.createHistoryId(),
      fileName,
      analyzedAt: new Date().toLocaleString(),
      resumeScore: analysis.resumeScore,
      atsScore: analysis.atsScore,
      analysis,
      resumeText,
    };

    const updatedHistory = [historyItem, ...this.history()].slice(0, 5);
    this.history.set(updatedHistory);

    if (this.hasLocalStorage()) {
      localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));
    }
  }

  private loadHistory(): ResumeHistoryItem[] {
    if (!this.hasLocalStorage()) {
      return [];
    }

    try {
      const rawHistory = localStorage.getItem(historyStorageKey);
      return rawHistory ? (JSON.parse(rawHistory) as ResumeHistoryItem[]) : [];
    } catch {
      return [];
    }
  }

  private loadJdHistory(): JDHistoryItem[] {
    if (!this.hasLocalStorage()) {
      return [];
    }

    try {
      const rawHistory = localStorage.getItem(jdHistoryStorageKey);
      return rawHistory ? (JSON.parse(rawHistory) as JDHistoryItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveJdHistory(jobDescription: JobDescription, atsScore: ATSScore): void {
    const historyItem: JDHistoryItem = {
      id: this.createHistoryId(),
      jobDescription,
      atsScore,
      comparedAt: new Date().toISOString(),
    };

    const updatedHistory = [historyItem, ...this.jdHistory()].slice(0, 10);
    this.jdHistory.set(updatedHistory);

    if (this.hasLocalStorage()) {
      localStorage.setItem(jdHistoryStorageKey, JSON.stringify(updatedHistory));
    }
  }

  private hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private createHistoryId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private toUserFriendlyError(error: unknown): string {
    const fallback = 'Analysis failed. Please check your API key, quota, or internet connection and try again.';

    if (!(error instanceof Error)) {
      return fallback;
    }

    const message = error.message.trim();

    if (!message || message.includes('{') || message.includes('}') || message.toLowerCase().includes('<html')) {
      return fallback;
    }

    return message;
  }
}
