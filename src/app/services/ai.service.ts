import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ResumeAnalysis } from '../interfaces/resume-analysis';

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface GroqErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.3-70b-versatile';
  private readonly maxResumeCharacters = 24000;

  async analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
    const cleanResumeText = this.prepareResumeText(resumeText);

    if (!cleanResumeText) {
      throw new Error('No readable resume text was found in the uploaded PDF.');
    }

    if (!environment.groqApiKey || environment.groqApiKey === 'YOUR_GROQ_API_KEY') {
      throw new Error('Groq API key is missing. Add it to src/environments/environment.ts.');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${environment.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: this.buildPrompt(cleanResumeText),
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(await this.toFriendlyApiError(response));
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Groq returned an empty analysis. Please try again.');
      }

      return this.parseAnalysis(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error('AI analysis failed. Please check your connection and try again.');
    }
  }

  private buildPrompt(resumeText: string): string {
    return `You are a senior technical recruiter and ATS resume analyst.

Analyze this resume professionally for an ATS-friendly job application.

Return a practical resume review with:
1. Resume score out of 100
2. ATS score out of 100
3. Technical skills detected
4. Missing important skills or keywords
5. ATS optimization suggestions
6. Resume improvement tips
7. Career suggestions
8. Strengths
9. Weaknesses
10. A short executive summary

Return only valid JSON with this exact shape. Do not include markdown, code fences, comments, or extra text:
{
  "resumeScore": 0,
  "atsScore": 0,
  "technicalSkillsFound": [],
  "missingImportantSkills": [],
  "atsOptimizationSuggestions": [],
  "resumeImprovementRecommendations": [],
  "careerSuggestions": [],
  "strengths": [],
  "weaknesses": [],
  "summary": ""
}

Keep every array item concise, specific, and presentation-ready.

Resume:
${resumeText}`;
  }

  private prepareResumeText(resumeText: string): string {
    const cleanResumeText = resumeText.trim().replace(/\s{3,}/g, ' ');

    if (cleanResumeText.length <= this.maxResumeCharacters) {
      return cleanResumeText;
    }

    return cleanResumeText.slice(0, this.maxResumeCharacters);
  }

  private async toFriendlyApiError(response: Response): Promise<string> {
    const fallback = 'Analysis failed. Please check your API key, quota, or network connection and try again.';

    try {
      const data = (await response.json()) as GroqErrorResponse;
      const code = data.error?.code?.toLowerCase();
      const type = data.error?.type?.toLowerCase();

      if (response.status === 401) {
        return 'Groq API authentication failed. Please verify your API key in environment.ts.';
      }

      if (response.status === 429 || code === 'rate_limit_exceeded' || type === 'rate_limit_exceeded') {
        return 'Groq rate limit reached. Please wait a moment and try again.';
      }

      if (response.status >= 500) {
        return 'Groq is temporarily unavailable. Please try again shortly.';
      }

      if (code === 'model_decommissioned' || data.error?.message?.toLowerCase().includes('decommissioned')) {
        return 'The selected AI model is no longer available. Please update the Groq model and try again.';
      }

      return fallback;
    } catch {
      return fallback;
    }
  }

  private parseAnalysis(rawResponse: string): ResumeAnalysis {
    const jsonText = this.extractJson(rawResponse);

    try {
      const parsed = JSON.parse(jsonText) as Partial<ResumeAnalysis>;

      return {
        resumeScore: this.toScore(parsed.resumeScore),
        atsScore: this.toScore(parsed.atsScore),
        technicalSkillsFound: this.toStringArray(parsed.technicalSkillsFound),
        missingImportantSkills: this.toStringArray(parsed.missingImportantSkills),
        atsOptimizationSuggestions: this.toStringArray(parsed.atsOptimizationSuggestions),
        resumeImprovementRecommendations: this.toStringArray(parsed.resumeImprovementRecommendations),
        careerSuggestions: this.toStringArray(parsed.careerSuggestions),
        strengths: this.toStringArray(parsed.strengths),
        weaknesses: this.toStringArray(parsed.weaknesses),
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis completed successfully.',
      };
    } catch {
      throw new Error('AI returned an unreadable response. Please retry the analysis.');
    }
  }

  private extractJson(response: string): string {
    const fencedJson = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    const candidate = fencedJson ?? response;
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('AI returned an unreadable response. Please retry the analysis.');
    }

    return candidate.slice(firstBrace, lastBrace + 1);
  }

  private toScore(value: unknown): number {
    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numericValue) ? Math.min(100, Math.max(0, Math.round(numericValue))) : 0;
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
}
