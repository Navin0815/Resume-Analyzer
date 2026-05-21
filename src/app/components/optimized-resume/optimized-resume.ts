import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OptimizedResume } from '../../interfaces/resume-analysis';

@Component({
  selector: 'app-optimized-resume',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './optimized-resume.html',
  styleUrl: './optimized-resume.scss',
  host: {
    class: 'app-optimized-resume',
  },
})
export class OptimizedResumeComponent {
  readonly optimizedResume = input<OptimizedResume>({
    summary: '',
    bulletPoints: [],
    keywordsToAdd: [],
    atsOptimizedContent: '',
    improvementSuggestions: [],
    originalVsOptimized: [],
  });
  readonly resumeText = input<string>('');

  readonly downloadClicked = output<void>();

  constructor(private snackBar: MatSnackBar) {}

  protected copySummary(): void {
    this.copyToClipboard(this.optimizedResume().summary, 'Professional summary copied!');
  }

  protected copyBulletPoints(): void {
    const text = this.optimizedResume().bulletPoints.join('\n• ');
    this.copyToClipboard(text, 'Bullet points copied!');
  }

  protected copyKeywords(): void {
    const text = this.optimizedResume().keywordsToAdd.join(', ');
    this.copyToClipboard(text, 'Keywords copied!');
  }

  protected copyOptimizedContent(): void {
    this.copyToClipboard(this.optimizedResume().atsOptimizedContent, 'Optimized resume copied!');
  }

  protected downloadOptimized(): void {
    this.downloadClicked.emit();
  }

  private copyToClipboard(text: string, message: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(message, 'Close', { duration: 2000 });
    });
  }
}
