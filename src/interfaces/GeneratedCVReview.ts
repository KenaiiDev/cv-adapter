import type { CVData } from '../domain/entities/CVData.js';

export interface GeneratedCVReview {
  isInteractive(): boolean;
  review(cvData: CVData): Promise<boolean>;
}
