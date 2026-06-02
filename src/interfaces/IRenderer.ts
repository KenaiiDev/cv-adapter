import type { CVData } from '../domain/entities/CVData.js';

export interface IRenderer {
  toHTML(cvData: CVData): Promise<string>;
}