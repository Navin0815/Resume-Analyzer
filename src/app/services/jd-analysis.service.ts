import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { JobDescription, JDRequirements } from '../interfaces/resume-analysis';

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class JdAnalysisService {
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.3-70b-versatile';
  private readonly maxJdCharacters = 24000;
  private readonly browserApiKeyStorageKey = 'ai-resume-analyzer-groq-key';

  async analyzeJobDescription(jdText: string, apiKey?: string): Promise<JDRequirements> {
    const cleanJdText = this.prepareJdText(jdText);
    const finalApiKey = apiKey || this.getApiKey();

    if (!cleanJdText) {
      throw new Error('No readable job description text was found.');
    }

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
              content: this.buildJdAnalysisPrompt(cleanJdText),
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
        throw new Error('Groq returned an empty JD analysis.');
      }

      return this.parseJdRequirements(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('JD analysis failed. Please check your connection and try again.');
    }
  }

  private buildJdAnalysisPrompt(jdText: string): string {
    return `You are a senior technical recruiter and job analyst.

Analyze this job description and extract structured requirements.

Return ONLY valid JSON with this exact structure. No markdown, code fences, comments, or extra text:
{
  "technicalSkills": [],
  "tools": [],
  "technologies": [],
  "certifications": [],
  "keywords": [],
  "roleType": "Software Engineer",
  "seniorityLevel": "Senior",
  "yearsOfExperience": 5,
  "preferredQualifications": []
}

Guidelines:
- technicalSkills: Specific skills (React, Java, Data Structures, etc.)
- tools: Tools & platforms (Git, Docker, Jenkins, etc.)
- technologies: Frameworks & tech stacks (Spring Boot, Node.js, etc.)
- certifications: Required or preferred certifications
- keywords: Important domain keywords and industry terms
- yearsOfExperience: Extract as number, default 3 if not specified
- preferredQualifications: Nice-to-have qualifications

Job Description:
${jdText}`;
  }

  private parseJdRequirements(content: string): JDRequirements {
    try {
      const parsed = JSON.parse(content);
      return {
        technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : [],
        tools: Array.isArray(parsed.tools) ? parsed.tools : [],
        technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        roleType: parsed.roleType || 'Engineer',
        seniorityLevel: parsed.seniorityLevel || 'Mid-Level',
        yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : 3,
        preferredQualifications: Array.isArray(parsed.preferredQualifications) ? parsed.preferredQualifications : [],
      };
    } catch {
      throw new Error('Failed to parse JD requirements. Please try again.');
    }
  }

  private prepareJdText(jdText: string): string {
    const cleanJdText = jdText.trim().replace(/\s{3,}/g, ' ');
    return cleanJdText.length <= this.maxJdCharacters ? cleanJdText : cleanJdText.slice(0, this.maxJdCharacters);
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
