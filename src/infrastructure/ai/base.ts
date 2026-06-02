import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';

export abstract class BaseAIProvider implements IAIProvider {
  abstract getProviderName(): string;
  abstract getModel(): string;
  abstract getEndpoint(): string;
  protected abstract buildPrompt(profile: Profile, vacancy: string, language: Language): string;
  protected abstract parseResponse(content: string): Partial<CVData>;

  async generateCV(profile: Profile, vacancy: string, language: Language): Promise<CVData> {
    const prompt = this.buildPrompt(profile, vacancy, language);

    const response = await this.callAPI(prompt);

    const cvData = this.parseResponse(response);

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