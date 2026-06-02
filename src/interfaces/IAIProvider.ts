import type { Profile } from '../domain/entities/Profile.js';
import type { CVData } from '../domain/entities/CVData.js';

export type Language = 'es' | 'en';

export interface IAIProvider {
  generateCV(profile: Profile, vacancy: string, language: Language): Promise<CVData>;
  getProviderName(): string;
}