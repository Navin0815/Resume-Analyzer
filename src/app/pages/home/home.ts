import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { ResumeAnalysis, ResumeHistoryItem } from '../../interfaces/resume-analysis';
import { AiService } from '../../services/ai.service';
import { PdfService } from '../../services/pdf.service';
import { ReportService } from '../../services/report.service';

const historyStorageKey = 'ai-resume-analyzer-history';

@Component({
  selector: 'app-home',
  imports: [
    AnalysisDashboardComponent,
    LoadingSpinnerComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    ResumePreviewComponent,
    UploadResumeComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly aiService = inject(AiService);
  private readonly pdfService = inject(PdfService);
  private readonly reportService = inject(ReportService);
  private readonly snackBar = inject(MatSnackBar);
  private progressTimer: number | undefined;
  private lastSelectedFile: File | null = null;

  protected readonly selectedFileName = signal('');
  protected readonly resumeText = signal('');
  protected readonly analysis = signal<ResumeAnalysis | null>(null);
  protected readonly loading = signal(false);
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly history = signal<ResumeHistoryItem[]>(this.loadHistory());
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
