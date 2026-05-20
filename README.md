# AI Resume Analyzer

AI Resume Analyzer is a modern Angular dashboard app that uploads PDF resumes, extracts readable text with `pdfjs-dist`, sends the resume content to GroqCloud, and displays a professional analysis report.

## Features

- PDF-only resume upload with drag and drop
- File validation, upload progress, loading states, and error handling
- PDF text extraction through `pdfjs-dist`
- GroqCloud chat completions API integration
- Resume score and ATS score dashboards
- Technical skills found, missing keywords, ATS tips, improvements, career suggestions, strengths, and weaknesses
- Resume text preview
- Dark mode toggle
- Recent resume analysis history in browser storage
- Copy suggestions button
- Download analysis report as PDF
- Responsive Angular Material dashboard UI

## Tech Stack

- Angular 21 standalone components
- Angular Material
- TypeScript
- SCSS
- GroqCloud API with `llama-3.3-70b-versatile`
- `pdfjs-dist`
- `jspdf`

## Project Structure

```text
src/app/
  components/
    analysis-dashboard/
    footer/
    loading-spinner/
    navbar/
    resume-preview/
    score-card/
    upload-resume/
  interfaces/
    resume-analysis.ts
  pages/
    home/
  services/
    ai.service.ts
    pdf.service.ts
    report.service.ts
  app.config.ts
  app.routes.ts
src/environments/
  environment.ts
  environment.example.ts
```

## Installation

Install dependencies:

```bash
npm install
```

The important packages used by the app are:

```bash
npm install @angular/material @angular/cdk @angular/animations pdfjs-dist jspdf
```

## Groq API Configuration

1. Create a GroqCloud API key from the Groq console.
2. Open `src/environments/environment.ts`.
3. Add your key:

```ts
export const environment = {
  production: false,
  groqApiKey: 'YOUR_GROQ_API_KEY',
};
```

For production deployments, use a backend proxy or serverless function to protect the API key. This academic/demo project keeps the key in Angular environment config for clarity.

## Run the App

Start the development server:

```bash
npm start
```

Open:

```text
http://localhost:4200/
```

## Public GitHub Pages Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

After pushing to GitHub:

1. Open the repository on GitHub.
2. Go to `Settings` > `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to the `main` branch, or run the workflow manually from the `Actions` tab.

The public frontend URL will be:

```text
https://navin0815.github.io/Resume-Analyzer/
```

Important: do not commit a real Groq API key to a public repository. For a production public app, route Groq requests through a backend proxy or serverless function and keep the key as a server-side secret. The Angular environment file is suitable for local academic demos only.

## Build

Create a production build:

```bash
npm run build
```

The output is written to `dist/ai-resume-analyzer/`.

## How It Works

1. The user uploads a PDF resume.
2. `PdfService` validates the file and extracts readable text from each PDF page.
3. `AiService` sends the extracted text to GroqCloud with a structured resume-analysis prompt.
4. Groq returns JSON with scores, skills, ATS tips, recommendations, and career guidance.
5. `AnalysisDashboardComponent` presents the results in a responsive Material dashboard.
6. `ReportService` can export the analysis as a PDF report.

## Verification

The project was verified with:

```bash
npm run build
```

The build completes successfully. Angular may show CommonJS optimization warnings from `jspdf` dependencies used for PDF export; those warnings do not prevent the application from running.
