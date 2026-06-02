import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import { BaseAIProvider } from './base.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class OllamaAI extends BaseAIProvider {
  getProviderName(): string {
    return 'ollama';
  }

  getModel(): string {
    return process.env.OLLAMA_MODEL || 'llama3.2';
  }

  getEndpoint(): string {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    return `${baseUrl}/api/chat`;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.getModel(),
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new DomainError(
        `Ollama API error: ${response.status}`,
        'AI_ERROR',
        'Make sure Ollama is running locally (ollama serve)'
      );
    }

    const data: any = await response.json();
    return data.message?.content || '';
  }

  protected parseResponse(content: string): Partial<CVData> {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new DomainError('Failed to parse Ollama response', 'AI_ERROR');
    }
  }
}

export const ollamaAI = new OllamaAI();