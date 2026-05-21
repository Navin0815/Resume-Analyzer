import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-ats-score-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule, MatTooltipModule],
  templateUrl: './ats-score-card.html',
  styleUrl: './ats-score-card.scss',
  host: {
    class: 'app-ats-score-card',
  },
})
export class AtsScoreCardComponent {
  readonly resumeMatchPercentage = input<number>(0);
  readonly atsCompatibilityScore = input<number>(0);
  readonly skillMatchPercentage = input<number>(0);
  readonly jobTitle = input<string>('Job Position');
  readonly overallScore = computed(() => {
    const avg = (this.resumeMatchPercentage() + this.atsCompatibilityScore() + this.skillMatchPercentage()) / 3;
    return Math.round(avg);
  });

  protected getScoreColor(score: number): string {
    if (score >= 80) return 'accent';
    if (score >= 60) return 'primary';
    return 'warn';
  }

  protected getScoreStatus(score: number): string {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Improvement';
  }

  protected getScoreIcon(score: number): string {
    if (score >= 80) return 'thumb_up';
    if (score >= 60) return 'trending_up';
    if (score >= 40) return 'info';
    return 'warning';
  }
}
