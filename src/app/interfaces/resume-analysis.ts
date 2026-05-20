export interface ResumeAnalysis {
  resumeScore: number;
  atsScore: number;
  technicalSkillsFound: string[];
  missingImportantSkills: string[];
  atsOptimizationSuggestions: string[];
  resumeImprovementRecommendations: string[];
  careerSuggestions: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface ResumeHistoryItem {
  id: string;
  fileName: string;
  analyzedAt: string;
  resumeScore: number;
  atsScore: number;
  analysis: ResumeAnalysis;
  resumeText: string;
}
