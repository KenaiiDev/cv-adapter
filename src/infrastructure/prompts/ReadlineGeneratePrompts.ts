import * as readline from 'readline';
import type { Language } from '../../interfaces/IAIProvider.js';
import type { GeneratePrompts } from '../../interfaces/GeneratePrompts.js';

export class ReadlineGeneratePrompts implements GeneratePrompts {
  async requestLanguage(): Promise<Language> {
    const answer = await this.ask('\n🌐 Select language (es/en): ');
    return answer.trim().toLowerCase() === 'en' ? 'en' : 'es';
  }

  async requestFilename(): Promise<string> {
    const answer = await this.ask('\n📁 Enter filename for PDF (without extension): ');
    const filename = answer.trim().replace(/\.pdf$/i, '');
    return filename || 'CV-generated';
  }

  private ask(question: string): Promise<string> {
    return new Promise((resolve) => {
      const reader = readline.createInterface({ input: process.stdin, output: process.stdout });
      reader.question(question, (answer) => {
        reader.close();
        resolve(answer);
      });
    });
  }
}
