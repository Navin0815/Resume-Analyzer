import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-resume-preview',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './resume-preview.html',
  styleUrl: './resume-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePreviewComponent {
  readonly resumeText = input('');
  readonly fileName = input('');

  protected readonly previewText = computed(() => {
    const text = this.resumeText().trim();
    return text.length > 1800 ? `${text.slice(0, 1800)}...` : text;
  });
}
