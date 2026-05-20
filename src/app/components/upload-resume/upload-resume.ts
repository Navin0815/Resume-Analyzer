import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-upload-resume',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './upload-resume.html',
  styleUrl: './upload-resume.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadResumeComponent {
  readonly selectedFileName = input('');
  readonly progress = input(0);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly fileSelected = output<File>();
  readonly retryRequested = output<void>();

  protected readonly isDragging = signal(false);

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (file) {
      this.fileSelected.emit(file);
    }

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files.item(0);

    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
