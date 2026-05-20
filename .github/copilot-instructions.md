# AI Resume Analyzer Workspace Instructions

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements: Build a complete Angular AI Resume Analyzer with Angular Material, Gemini API integration, PDF text extraction, responsive dashboard UI, and documentation.
- [x] Scaffold the Project: Angular 21 app scaffolded in the current workspace with routing and SCSS.
- [x] Customize the Project: Added standalone components, services, interfaces, environment configuration, dashboard UI, drag-and-drop PDF upload, Gemini analysis, report export, dark mode, and resume history.
- [x] Install Required Extensions: No extensions were required by project setup information.
- [x] Compile the Project: `npm run build` completes successfully. Only expected CommonJS optimization warnings appear from `jspdf` transitive dependencies.
- [x] Create and Run Task: Existing Angular CLI tasks are available in `.vscode/tasks.json`; no additional task was required.
- [x] Launch the Project: Use `npm start` or `ng serve` after configuring the Gemini API key.
- [x] Ensure Documentation is Complete: README.md and this instruction file are up to date.

## Development Notes

- Use standalone Angular components and signals for local state.
- Keep API keys in `src/environments/environment.ts` for local academic/demo use only.
- Use a backend proxy before deploying to production so Gemini API keys are not exposed to browsers.
- Run `npm run build` before handing off major changes.
