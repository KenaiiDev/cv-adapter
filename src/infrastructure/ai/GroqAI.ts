import * as dotenv from 'dotenv';
import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import { BaseAIProvider } from './base.js';
import { PromptBuilder, type PromptOptions } from './PromptBuilder.js';
import { DomainError } from '../../domain/errors/DomainError.js';

dotenv.config();

const promptBuilder = new PromptBuilder();

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

  protected buildPrompt(profile: Profile, vacancy: string, language: Language, options: PromptOptions): string {
    return promptBuilder.build(profile, vacancy, language, options);
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