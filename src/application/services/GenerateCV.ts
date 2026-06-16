import type { Profile } from '../../domain/entities/Profile.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';

export class GenerateCV {
  private aiProvider: IAIProvider;

  constructor(aiProvider: IAIProvider) {
    this.aiProvider = aiProvider;
  }

  async execute(profile: Profile, vacancy: string, language: Language): Promise<CVData> {
    console.log(`🤖 Generating CV using ${this.aiProvider.getProviderName()}...`);

    const cvData = await this.aiProvider.generateCV(profile, vacancy, language);

    return cvData;
  }
}