import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import { BaseAIProvider } from './base.js';
import { PromptBuilder, type PromptOptions } from './PromptBuilder.js';
import { DomainError } from '../../domain/errors/DomainError.js';

const promptBuilder = new PromptBuilder();

export class AnthropicAI extends BaseAIProvider {
  getProviderName(): string {
    return 'anthropic';
  }

  getModel(): string {
    return process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
  }

  getEndpoint(): string {
    return 'https://api.anthropic.com/v1/messages';
  }

  protected getAPIKey(): string {
    const key = process.env.AI_API_KEY;
    if (!key) {
      throw new DomainError(
        'Anthropic API key not configured',
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
        'x-api-key': this.getAPIKey(),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.getModel(),
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new DomainError(`Anthropic API error: ${response.status}`, 'AI_ERROR');
    }

    const data: any = await response.json();
    return data.content[0]?.text || '';
  }

  protected parseResponse(content: string): Partial<CVData> {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new DomainError('Failed to parse Anthropic response', 'AI_ERROR');
    }
  }
}

export const anthropicAI = new AnthropicAI();