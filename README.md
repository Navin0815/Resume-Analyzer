# AI Resume Analyzer

AI Resume Analyzer is now a modern Angular ATS Resume Optimizer that uploads PDF resumes, extracts readable text with `pdfjs-dist`, compares the resume against a job description, sends both to GroqCloud, and displays a professional optimization report.

## Features

- PDF-only resume upload with drag and drop
- File validation, upload progress, loading states, and error handling
- PDF text extraction through `pdfjs-dist`
- GroqCloud chat completions API integration
- Resume score and ATS score dashboards
- Technical skills found, missing keywords, ATS tips, improvements, career suggestions, strengths, and weaknesses
- Job description paste area and optional JD upload support
- Resume vs job description comparison with match, ATS, and skill scores
- Missing skill and keyword gap detection
- AI resume rewriting and optimized content generation
- Multi-job comparison history in browser storage
- Resume text preview
- Dark mode toggle
- Recent resume analysis history in browser storage
- Copy suggestions button
- Download analysis report as PDF
- Download ATS comparison report as PDF
- Download optimized resume content
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
    ats-score-card/
    footer/
    jd-comparison-dashboard/
    job-description-input/
    loading-spinner/
    missing-skills/
    multi-job-history/
    optimized-resume/
    navbar/
    resume-preview/
    score-card/
    upload-resume/
  interfaces/
    resume-analysis.ts
  pages/
    home/
  services/
    ats.service.ts
    ai.service.ts
    jd-analysis.service.ts
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
2. For local development, open `src/environments/environment.ts`.
3. Add your key:

```ts
export const environment = {
  production: false,
  groqApiKey: 'YOUR_GROQ_API_KEY',
};
```

For production deployments, use a backend proxy or serverless function to protect the API key. This academic/demo project keeps the key in Angular environment config for clarity.

For the public GitHub Pages demo, use the in-app `GroqCloud setup` card. Paste your key there and it will be stored only in your browser local storage.

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
4. `JdAnalysisService` extracts job requirements from pasted or uploaded job descriptions.
5. `AtsService` compares the resume against the job description, calculates match scores, and generates optimized resume content.
6. `JdComparisonDashboardComponent` presents the ATS analysis in a responsive Material dashboard.
7. `ReportService` can export both the resume analysis and ATS comparison as PDF reports.

## Verification

The project was verified with:

```bash
npm run build
```

The build completes successfully. Angular may show CommonJS optimization warnings from `jspdf` dependencies used for PDF export; those warnings do not prevent the application from running.
