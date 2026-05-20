import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ResumeAnalysis } from '../../interfaces/resume-analysis';
import { ScoreCardComponent } from '../score-card/score-card';

@Component({
  selector: 'app-analysis-dashboard',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, ScoreCardComponent],
  templateUrl: './analysis-dashboard.html',
  styleUrl: './analysis-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisDashboardComponent {
  readonly analysis = input<ResumeAnalysis | null>(null);
  readonly copyRequested = output<void>();
  readonly downloadRequested = output<void>();
}
