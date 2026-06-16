import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';
import { PromptBuilder, getCurrentDate, type PromptOptions } from './PromptBuilder.js';
import { CVDataSchema, formatZodError } from './schemas.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export abstract class BaseAIProvider implements IAIProvider {
  abstract getProviderName(): string;
  abstract getModel(): string;
  abstract getEndpoint(): string;
  protected abstract buildPrompt(profile: Profile, vacancy: string, language: Language, options: PromptOptions): string;
  protected abstract parseResponse(content: string): Partial<CVData>;

  async generateCV(profile: Profile, vacancy: string, language: Language): Promise<CVData> {
    const options: PromptOptions = { currentDate: getCurrentDate() };
    const prompt = this.buildPrompt(profile, vacancy, language, options);

    const response = await this.callAPI(prompt);

    const raw = this.parseResponse(response);

    const result = CVDataSchema.safeParse(raw);
    if (!result.success) {
      throw new DomainError(
        'AI returned malformed CVData',
        'AI_VALIDATION',
        formatZodError(result.error)
      );
    }

    const cvData = result.data;
    return {
      name: cvData.name || profile.name,
      contact: cvData.contact || profile.contact,
      summary: cvData.summary || '',
      experience: cvData.experience || [],
      education: cvData.education || [],
      skills: cvData.skills || [],
      languages: cvData.languages || [],
      generated_at: new Date().toISOString(),
    };
  }

  protected abstract callAPI(prompt: string): Promise<string>;
}
