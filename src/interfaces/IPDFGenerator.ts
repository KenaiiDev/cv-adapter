import type { CVData } from '../domain/entities/CVData.js';
import type { Language } from './IAIProvider.js';

export interface IPDFGenerator {
  generate(cvData: CVData, language: Language): Promise<Buffer>;
}