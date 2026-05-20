import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

type PdfTextItem = {
  str?: string;
};

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  }

  async extractTextFromPdf(file: File): Promise<string> {
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (item as PdfTextItem).str ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        pageTexts.push(pageText);
      }
    }

    const extractedText = pageTexts.join('\n\n').trim();

    if (!extractedText) {
      throw new Error('The PDF did not contain readable text. Try a text-based resume PDF.');
    }

    return extractedText;
  }
}
