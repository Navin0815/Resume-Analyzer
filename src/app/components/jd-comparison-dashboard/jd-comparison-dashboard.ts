import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AtsScoreCardComponent } from '../ats-score-card/ats-score-card';
import { MissingSkillsComponent } from '../missing-skills/missing-skills';
import { OptimizedResumeComponent } from '../optimized-resume/optimized-resume';
import { ATSScore } from '../../interfaces/resume-analysis';

@Component({
  selector: 'app-jd-comparison-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    AtsScoreCardComponent,
    MissingSkillsComponent,
    OptimizedResumeComponent,
  ],
  templateUrl: './jd-comparison-dashboard.html',
  styleUrl: './jd-comparison-dashboard.scss',
  host: {
    class: 'app-jd-comparison-dashboard',
  },
})
export class JdComparisonDashboardComponent {
  readonly atsScore = input<ATSScore | null>(null);
  readonly isLoading = input(false);

  readonly downloadOptimizedClicked = output<void>();
  readonly downloadAnalysisClicked = output<void>();

  protected getMatchedSkillsCount(): number {
    return this.atsScore()?.details.matchedSkills.length || 0;
  }

  protected getMissingSkillsCount(): number {
    return this.atsScore()?.details.missingSkills.length || 0;
  }

  protected getAtsIssuesCount(): number {
    return this.atsScore()?.details.atsIssues.length || 0;
  }
}
