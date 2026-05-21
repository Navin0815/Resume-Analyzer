// ===== Resume Analysis (Standalone) =====
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

// ===== Job Description =====
export interface JobDescription {
  id: string;
  title: string;
  company: string;
  text: string;
  source: 'text' | 'pdf' | 'txt';
  extractedAt: string;
  requirements?: JDRequirements;
}

export interface JDRequirements {
  technicalSkills: string[];
  tools: string[];
  technologies: string[];
  certifications: string[];
  keywords: string[];
  roleType: string;
  seniorityLevel: string;
  yearsOfExperience: number;
  preferredQualifications: string[];
}

// ===== ATS Comparison & Scoring =====
export interface ATSScore {
  id: string;
  jobDescriptionId: string;
  jobTitle: string;
  resumeMatchPercentage: number;
  atsCompatibilityScore: number;
  skillMatchPercentage: number;
  overallScore: number;
  details: {
    resumeText: string;
    jdText: string;
    matchedSkills: string[];
    missingSkills: SkillGap[];
    matchedKeywords: string[];
    missingKeywords: string[];
    atsIssues: string[];
    atsRecommendations: string[];
  };
  optimizedResume: OptimizedResume;
  analyzedAt: string;
}

export interface SkillGap {
  skill: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
  category: 'technical' | 'tool' | 'certification' | 'keyword';
}

export interface OptimizedResume {
  summary: string;
  bulletPoints: string[];
  keywordsToAdd: string[];
  atsOptimizedContent: string;
  improvementSuggestions: string[];
  originalVsOptimized: {
    original: string;
    optimized: string;
  }[];
}

// ===== Multi-JD Comparison =====
export interface MultiJDComparison {
  resumeId: string;
  resumeFileName: string;
  jobDescriptions: JobDescription[];
  atsScores: ATSScore[];
  bestMatchingJob: ATSScore | null;
  lowestMatchingJob: ATSScore | null;
  highestAtsScore: ATSScore | null;
  comparisonSummary: string;
}

export interface JDHistoryItem {
  id: string;
  jobDescription: JobDescription;
  atsScore: ATSScore;
  comparedAt: string;
}
