import type { Language } from './IAIProvider.js';

export interface GeneratePrompts {
  requestLanguage(): Promise<Language>;
  requestFilename(): Promise<string>;
}
