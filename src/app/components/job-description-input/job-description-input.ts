import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-job-description-input',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './job-description-input.html',
  styleUrl: './job-description-input.scss',
  host: {
    class: 'app-job-description-input',
  },
})
export class JobDescriptionInputComponent implements OnInit {
  readonly isLoading = input(false);
  readonly jdText = input('');

  readonly jdUpdated = output<string>();
  readonly fileSelected = output<{ text: string; fileName: string }>();

  protected dragOver = signal(false);
  protected characterCount = signal(0);
  protected maxCharacters = 24000;
  protected minCharacters = 100;
  protected isValidLength = signal(true);
  protected fileInput: HTMLInputElement | null = null;

  constructor(private pdfService: PdfService) {}

  ngOnInit(): void {
    this.updateCharacterCount(this.jdText());
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.handleFile(files[0]);
    }
  }

  protected onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const text = textarea.value;
    this.updateCharacterCount(text);
    this.jdUpdated.emit(text);
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  protected triggerFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = '.pdf,.txt,.doc,.docx';
      this.fileInput.addEventListener('change', (e) => this.onFileInputChange(e));
    }
    this.fileInput.click();
  }

  private async handleFile(file: File): Promise<void> {
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, TXT, or DOCX file.');
      return;
    }

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await this.pdfService.extractTextFromPdf(file);
      } else if (file.type === 'text/plain' || file.type.includes('wordprocessingml')) {
        text = await file.text();
      }

      this.updateCharacterCount(text);
      this.fileSelected.emit({ text, fileName: file.name });
      this.jdUpdated.emit(text);
    } catch (error) {
      alert(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateCharacterCount(text: string): void {
    const count = text.length;
    this.characterCount.set(count);
    this.isValidLength.set(count >= this.minCharacters && count <= this.maxCharacters);
  }
}
