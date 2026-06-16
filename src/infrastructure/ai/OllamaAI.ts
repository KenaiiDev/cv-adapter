import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import { BaseAIProvider } from './base.js';
import { PromptBuilder, type PromptOptions } from './PromptBuilder.js';
import { DomainError } from '../../domain/errors/DomainError.js';

const promptBuilder = new PromptBuilder();

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

  protected buildPrompt(profile: Profile, vacancy: string, language: Language, options: PromptOptions): string {
    return promptBuilder.build(profile, vacancy, language, options);
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