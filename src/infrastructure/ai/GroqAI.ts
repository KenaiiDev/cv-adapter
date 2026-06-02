import * as dotenv from 'dotenv';
import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import { BaseAIProvider } from './base.js';
import { DomainError } from '../../domain/errors/DomainError.js';

dotenv.config();

export class GroqAI extends BaseAIProvider {
  getProviderName(): string {
    return 'groq';
  }

  getModel(): string {
    return 'llama-3.1-70b-versatile';
  }

  getEndpoint(): string {
    return 'https://api.groq.com/openai/v1/chat/completions';
  }

  private getAPIKey(): string {
    const key = process.env.AI_API_KEY;
    if (!key) {
      throw new DomainError(
        'Groq API key not configured',
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
  "skills": [
    { "category": "Lenguajes", "items": ["JavaScript", "TypeScript"] },
    { "category": "Frameworks", "items": ["React", "Node.js"] }
  ],
  "languages": [{ "language": "...", "level": "..." }]
}`;
  }

  protected async callAPI(prompt: string): Promise<string> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAPIKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.getModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new DomainError(
        `Groq API error: ${response.status}`,
        'AI_ERROR',
        'Check your AI_API_KEY and try again'
      );
    }

    const data: any = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  protected parseResponse(content: string): Partial<CVData> {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new DomainError(
        'Failed to parse AI response as JSON',
        'AI_ERROR',
        'The AI returned an invalid format. Try regenerating.'
      );
    }
  }
}

export const groqAI = new GroqAI();