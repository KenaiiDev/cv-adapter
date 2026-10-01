import inquirer from 'inquirer';
import { formatCVPreview } from '../../application/services/FormatCVPreview.js';
import type { CVData } from '../../domain/entities/CVData.js';
import type { GeneratedCVReview } from '../../interfaces/GeneratedCVReview.js';

export class InquirerGeneratedCVReview implements GeneratedCVReview {
  isInteractive(): boolean {
    return process.stdin.isTTY === true;
  }

  async review(cvData: CVData): Promise<boolean> {
    console.log(`\n${formatCVPreview(cvData)}\n`);
    const answer = await inquirer.prompt<{ approved: boolean }>([
      {
        type: 'confirm',
        name: 'approved',
        message: 'Generate and save this CV as a PDF?',
        default: false,
      },
    ]);
    return answer.approved;
  }
}
