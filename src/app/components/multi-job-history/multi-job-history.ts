import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { JDHistoryItem } from '../../interfaces/resume-analysis';

@Component({
  selector: 'app-multi-job-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTableModule, MatSortModule],
  templateUrl: './multi-job-history.html',
  styleUrl: './multi-job-history.scss',
  host: {
    class: 'app-multi-job-history',
  },
})
export class MultiJobHistoryComponent {
  readonly jobHistory = input<JDHistoryItem[]>([]);
  readonly selectedJobId = input<string | null>(null);

  readonly jobSelected = output<string>();
  readonly jobDeleted = output<string>();

  protected displayedColumns = signal<string[]>(['company', 'title', 'score', 'skillMatch', 'atsScore', 'date', 'actions']);

  protected getSortedHistory(): JDHistoryItem[] {
    return [...this.jobHistory()].sort((a, b) => new Date(b.comparedAt).getTime() - new Date(a.comparedAt).getTime());
  }

  protected getScoreIcon(score: number): string {
    if (score >= 80) return 'thumb_up';
    if (score >= 60) return 'trending_up';
    if (score >= 40) return 'info';
    return 'warning';
  }

  protected getScoreColor(score: number): string {
    if (score >= 80) return 'accent';
    if (score >= 60) return 'primary';
    return 'warn';
  }

  protected selectJob(jobId: string): void {
    this.jobSelected.emit(jobId);
  }

  protected deleteJob(jobId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this job comparison?')) {
      this.jobDeleted.emit(jobId);
    }
  }

  protected formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }
}
