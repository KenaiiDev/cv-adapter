import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import { BaseAIProvider } from './base.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class GeminiAI extends BaseAIProvider {
  getProviderName(): string {
    return 'gemini';
  }

  getModel(): string {
    return 'gemini-1.5-flash';
  }

  getEndpoint(): string {
    return 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  protected getAPIKey(): string {
    const key = process.env.AI_API_KEY;
    if (!key) {
      throw new DomainError(
        'Gemini API key not configured',
        'AI_ERROR',
        'Set AI_API_KEY in your .env file'
      );
    }
    return key;
  }

  protected buildPrompt(profile: Profile, vacancy: string, language: Language): string {
    const langLabel = language === 'es' ? 'español' : 'english';
    const profileJSON = JSON.stringify(profile, null, 2);

    return `You are an expert CV writer specializing in Harvard-style resumes.

Generate a tailored CV based on the user's profile and the job vacancy.
Output ONLY valid JSON, no markdown, no explanations.

Rules:
- Extract and adapt relevant experience/skills for the vacancy
- Use keywords from the vacancy naturally
- Rewrite descriptions to highlight achievements and impact
- Keep it concise and professional
- Output in ${langLabel}
- Follow Harvard style (clean, simple, no colors)

User Profile (JSON):
${profileJSON}

Job Vacancy:
${vacancy}

Output format (JSON only):
{
  "name": "Full Name",
  "contact": { "email": "...", "phone": "...", "location": "...", "linkedin": "...", "github": "..." },
  "summary": "Professional summary tailored to the vacancy",
  "experience": [{ "title": "...", "company": "...", "start_date": "...", "end_date": "...", "description": "..." }],
  "education": [{ "degree": "...", "institution": "...", "year": "...", "description": "..." }],
  "skills": ["...", "..."],
  "languages": [{ "language": "...", "level": "..." }]
}`;
  }

  protected async callAPI(prompt: string): Promise<string> {
    const url = `${this.getEndpoint()}/${this.getModel()}:generateContent?key=${this.getAPIKey()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });

    if (!response.ok) {
      throw new DomainError(`Gemini API error: ${response.status}`, 'AI_ERROR');
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  protected parseResponse(content: string): Partial<CVData> {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new DomainError('Failed to parse Gemini response', 'AI_ERROR');
    }
  }
}

export const geminiAI = new GeminiAI();