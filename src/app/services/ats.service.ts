import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ATSScore, SkillGap, OptimizedResume, JDRequirements } from '../interfaces/resume-analysis';

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface ComparisonResult {
  resumeMatchPercentage: number;
  atsCompatibilityScore: number;
  skillMatchPercentage: number;
  matchedSkills: string[];
  missingSkills: SkillGap[];
  matchedKeywords: string[];
  missingKeywords: string[];
  atsIssues: string[];
  atsRecommendations: string[];
}

interface OptimizationResult {
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

@Injectable({ providedIn: 'root' })
export class AtsService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.3-70b-versatile';
  private readonly browserApiKeyStorageKey = 'ai-resume-analyzer-groq-key';

  async compareResumeToJD(resumeText: string, jdText: string, jdRequirements?: JDRequirements, apiKey?: string): Promise<ComparisonResult> {
    const finalApiKey = apiKey || this.getApiKey();

    if (!finalApiKey) {
      throw new Error('Groq API key is missing.');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${finalApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: this.buildComparisonPrompt(resumeText, jdText, jdRequirements),
            },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(await this.toFriendlyApiError(response));
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Groq returned empty comparison result.');
      }

      return this.parseComparisonResult(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Resume-JD comparison failed. Please try again.');
    }
  }

  async optimizeResume(resumeText: string, jdText: string, jdRequirements?: JDRequirements, apiKey?: string): Promise<OptimizedResume> {
    const finalApiKey = apiKey || this.getApiKey();

    if (!finalApiKey) {
      throw new Error('Groq API key is missing.');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${finalApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: this.buildOptimizationPrompt(resumeText, jdText, jdRequirements),
            },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(await this.toFriendlyApiError(response));
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Groq returned empty optimization result.');
      }

      return this.parseOptimizationResult(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Resume optimization failed. Please try again.');
    }
  }

  private buildComparisonPrompt(resumeText: string, jdText: string, jdRequirements?: JDRequirements): string {
    const requirementsContext = jdRequirements
      ? `
Expected skills: ${jdRequirements.technicalSkills.join(', ')}
Expected tools: ${jdRequirements.tools.join(', ')}
Expected technologies: ${jdRequirements.technologies.join(', ')}
Key keywords: ${jdRequirements.keywords.join(', ')}
`
      : '';

    return `You are an expert ATS (Applicant Tracking System) specialist and recruiter.

Analyze how well this resume matches the job description.

${requirementsContext}

Return ONLY valid JSON with no markdown, code fences, or comments:
{
  "resumeMatchPercentage": 0,
  "atsCompatibilityScore": 0,
  "skillMatchPercentage": 0,
  "matchedSkills": [],
  "missingSkills": [
    {
      "skill": "Kubernetes",
      "severity": "high",
      "suggestion": "Add Kubernetes experience or certifications",
      "category": "technical"
    }
  ],
  "matchedKeywords": [],
  "missingKeywords": [],
  "atsIssues": [],
  "atsRecommendations": []
}

Scoring Guidelines:
- resumeMatchPercentage: How many JD requirements are in resume (0-100)
- atsCompatibilityScore: How ATS-friendly the resume is (0-100)
- skillMatchPercentage: Skill overlap (0-100)
- severity in missingSkills: critical, high, medium, low
- category: technical, tool, certification, keyword
- Keep arrays concise and specific
- ATS issues: Format problems, keyword density, structure issues
- Recommendations: Specific improvements for ATS optimization

Resume:
${resumeText}

Job Description:
${jdText}`;
  }

  private buildOptimizationPrompt(resumeText: string, jdText: string, jdRequirements?: JDRequirements): string {
    const requirementsContext = jdRequirements
      ? `
Target skills: ${jdRequirements.technicalSkills.join(', ')}
Target tools: ${jdRequirements.tools.join(', ')}
Key keywords: ${jdRequirements.keywords.join(', ')}
`
      : '';

    return `You are an expert resume writer and ATS optimization specialist.

Rewrite this resume to better match the job description while keeping it truthful and professional.

${requirementsContext}

Return ONLY valid JSON with no markdown, code fences, or comments:
{
  "summary": "Optimized professional summary",
  "bulletPoints": [
    "Optimized achievement 1",
    "Optimized achievement 2"
  ],
  "keywordsToAdd": ["keyword1", "keyword2"],
  "atsOptimizedContent": "Full resume text optimized for ATS",
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"],
  "originalVsOptimized": [
    {
      "original": "Original bullet point",
      "optimized": "Optimized version with better keywords and metrics"
    }
  ]
}

Guidelines:
- Use strong action verbs
- Include quantifiable metrics where possible
- Naturally incorporate JD keywords
- Improve clarity and ATS formatting
- bulletPoints: 5-7 most relevant achievements
- keywordsToAdd: 10-15 high-impact keywords
- originalVsOptimized: Show 3-5 key improvements
- Keep changes truthful and professional

Current Resume:
${resumeText}

Job Description:
${jdText}`;
  }

  private parseComparisonResult(content: string): ComparisonResult {
    try {
      const parsed = JSON.parse(content);
      return {
        resumeMatchPercentage: Math.min(100, Math.max(0, parsed.resumeMatchPercentage || 0)),
        atsCompatibilityScore: Math.min(100, Math.max(0, parsed.atsCompatibilityScore || 0)),
        skillMatchPercentage: Math.min(100, Math.max(0, parsed.skillMatchPercentage || 0)),
        matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
        missingSkills: this.validateSkillGaps(parsed.missingSkills || []),
        matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        atsIssues: Array.isArray(parsed.atsIssues) ? parsed.atsIssues : [],
        atsRecommendations: Array.isArray(parsed.atsRecommendations) ? parsed.atsRecommendations : [],
      };
    } catch {
      throw new Error('Failed to parse comparison result.');
    }
  }

  private parseOptimizationResult(content: string): OptimizedResume {
    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || '',
        bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
        keywordsToAdd: Array.isArray(parsed.keywordsToAdd) ? parsed.keywordsToAdd : [],
        atsOptimizedContent: parsed.atsOptimizedContent || '',
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
        originalVsOptimized: Array.isArray(parsed.originalVsOptimized) ? parsed.originalVsOptimized : [],
      };
    } catch {
      throw new Error('Failed to parse optimization result.');
    }
  }

  private validateSkillGaps(gaps: unknown[]): SkillGap[] {
    return gaps
      .map((gap: unknown) => {
        if (typeof gap === 'object' && gap !== null) {
          const g = gap as Record<string, unknown>;
          return {
            skill: typeof g['skill'] === 'string' ? g['skill'] : 'Unknown',
            severity: this.validateSeverity(g['severity']),
            suggestion: typeof g['suggestion'] === 'string' ? g['suggestion'] : 'Improve this skill',
            category: this.validateCategory(g['category']),
          };
        }
        return null;
      })
      .filter((g): g is SkillGap => g !== null);
  }

  private validateSeverity(severity: unknown): 'critical' | 'high' | 'medium' | 'low' {
    const valid = ['critical', 'high', 'medium', 'low'];
    return valid.includes(String(severity)) ? (severity as 'critical' | 'high' | 'medium' | 'low') : 'medium';
  }

  private validateCategory(category: unknown): 'technical' | 'tool' | 'certification' | 'keyword' {
    const valid = ['technical', 'tool', 'certification', 'keyword'];
    return valid.includes(String(category)) ? (category as 'technical' | 'tool' | 'certification' | 'keyword') : 'technical';
  }

  private getApiKey(): string {
    return environment.groqApiKey || this.getBrowserApiKey();
  }

  private getBrowserApiKey(): string {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.browserApiKeyStorageKey) || '';
    }
    return '';
  }

  private async toFriendlyApiError(response: Response): Promise<string> {
    try {
      const error = await response.json();
      const message = error?.error?.message || `API error: ${response.status}`;
      return message;
    } catch {
      return `API error: ${response.status} ${response.statusText}`;
    }
  }
}
