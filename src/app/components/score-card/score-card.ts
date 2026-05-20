import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-score-card',
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: './score-card.html',
  styleUrl: './score-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly description = input('');
  readonly accent = input<'blue' | 'teal' | 'amber'>('blue');

  protected readonly normalizedValue = computed(() => Math.min(100, Math.max(0, this.value())));
}
