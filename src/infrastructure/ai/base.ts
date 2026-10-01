import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';
import { PromptBuilder, getCurrentDate, type PromptOptions } from './PromptBuilder.js';
import { CVDataSchema, formatZodError, type AIResponse } from './schemas.js';
import { DomainError } from '../../domain/errors/DomainError.js';

const MAX_ATTEMPTS = 2;

export abstract class BaseAIProvider implements IAIProvider {
  abstract getProviderName(): string;
  abstract getModel(): string;
  abstract getEndpoint(): string;
  protected abstract buildPrompt(profile: Profile, vacancy: string, language: Language, options: PromptOptions): string;
  protected abstract parseResponse(content: string): unknown;

  async generateCV(profile: Profile, vacancy: string, language: Language): Promise<CVData> {
    const promptBuilder = new PromptBuilder();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const options: PromptOptions = {
        currentDate: getCurrentDate(),
        previousError: lastError,
      };
      const prompt = this.buildPrompt(profile, vacancy, language, options);
      const response = await this.callAPI(prompt);
      const raw = this.parseResponse(response);

      const result = CVDataSchema.safeParse(raw);
      if (result.success) {
        const referenceError = this.validateExperienceReferences(result.data, profile);
        if (!referenceError) {
          return this.complete(result.data, profile);
        }

        lastError = referenceError;
        continue;
      }

      lastError = formatZodError(result.error);
    }

    throw new DomainError(
      `AI failed to produce valid CVData after ${MAX_ATTEMPTS} attempts`,
      'AI_VALIDATION',
      lastError
    );
  }

  private complete(cvData: AIResponse, profile: Profile): CVData {
    const descriptions = new Map(
      cvData.experience.map(experience => [experience.profile_index, experience.description])
    );

    return {
      name: profile.name,
      contact: profile.contact,
      summary: cvData.summary,
      experience: profile.experience.map((experience, index) => ({
        ...experience,
        description: descriptions.get(index) ?? experience.description,
      })),
      education: profile.education,
      skills: profile.skills,
      languages: profile.languages,
      generated_at: new Date().toISOString(),
    };
  }

  private validateExperienceReferences(cvData: AIResponse, profile: Profile): string | undefined {
    const invalidReference = cvData.experience.find(
      experience => experience.profile_index >= profile.experience.length
    );

    if (!invalidReference) return undefined;

    return `- path experience: profile_index ${invalidReference.profile_index} does not reference a profile experience`;
  }

  protected abstract callAPI(prompt: string): Promise<string>;
}
