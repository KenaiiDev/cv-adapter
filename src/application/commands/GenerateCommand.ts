import * as dotenv from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { GenerateCV } from '../services/GenerateCV.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import { PDFGenerator } from '../../infrastructure/pdf/PDFGenerator.js';
import { GroqAI } from '../../infrastructure/ai/GroqAI.js';
import { GeminiAI } from '../../infrastructure/ai/GeminiAI.js';
import { OpenAIProvider } from '../../infrastructure/ai/OpenAI.js';
import { AnthropicAI } from '../../infrastructure/ai/AnthropicAI.js';
import { OllamaAI } from '../../infrastructure/ai/OllamaAI.js';

dotenv.config();

export class GenerateCommand {
  private repository: IProfileRepository;
  private aiProviderFactory: () => IAIProvider;

  constructor(
    repository: IProfileRepository,
    aiProviderFactory: () => IAIProvider
  ) {
    this.repository = repository;
    this.aiProviderFactory = aiProviderFactory;
  }

  async execute(vacancy: string, language?: Language): Promise<void> {
    try {
      const profile = await this.repository.load();
      if (!profile) {
        throw new DomainError(
          'No profile found. Run "cv init --pdf <path>" first.',
          'PROFILE_NOT_FOUND',
          'Run: cv init --pdf ~/path/to/your/cv.pdf'
        );
      }

      const lang: Language = language || await this.askLanguage();
      const aiProvider = this.aiProviderFactory();
      const generateCV = new GenerateCV(aiProvider);

      defaultLogger.log(`\n🎯 Vacancy: ${vacancy.substring(0, 80)}...`);
      defaultLogger.log(`🌐 Language: ${lang === 'es' ? 'Español' : 'English'}`);

      defaultLogger.log('\n📝 Generating CV...');
      const cvData = await generateCV.execute(profile, vacancy, lang);

      defaultLogger.log('✅ CV generated successfully');

      const filename = await this.askFilename();

      defaultLogger.log('📄 Generating PDF...');
      const pdfGenerator = new PDFGenerator();
      const buffer = await pdfGenerator.generate(cvData, lang);

      const outputPath = path.resolve(process.cwd(), `${filename}.pdf`);
      await fs.promises.writeFile(outputPath, buffer);

      defaultLogger.log(`✅ PDF saved to: ${outputPath}`);
    } catch (error) {
      if (error instanceof DomainError) {
        defaultLogger.error(error.toString());
      } else {
        defaultLogger.error('❌ Unexpected error:', error);
      }
      process.exit(1);
    }
  }

  private askLanguage(): Promise<Language> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('\n🌐 Select language (es/en): ', (answer: string) => {
        rl.close();
        const lang = answer.trim().toLowerCase() === 'en' ? 'en' : 'es';
        resolve(lang);
      });
    });
  }

  private askFilename(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('\n📁 Enter filename for PDF (without extension): ', (answer: string) => {
        rl.close();
        const filename = answer.trim().replace(/\.pdf$/i, '');
        if (!filename) {
          resolve('CV-generado');
        } else {
          resolve(filename);
        }
      });
    });
  }
}

export function createAIProviderFactory(): () => IAIProvider {
  return () => {
    const provider = process.env.ACTIVE_PROVIDER || 'groq';

    switch (provider) {
      case 'groq':
        return new GroqAI();
      case 'gemini':
        return new GeminiAI();
      case 'openai':
        return new OpenAIProvider();
      case 'anthropic':
        return new AnthropicAI();
      case 'ollama':
        return new OllamaAI();
      default:
        throw new DomainError(
          `Unknown provider: ${provider}`,
          'AI_ERROR',
          'Set ACTIVE_PROVIDER to: groq, gemini, openai, anthropic, or ollama'
        );
    }
  };
}

export function createGenerateCommand(): GenerateCommand {
  return new GenerateCommand(
    new JSONProfileRepository(),
    createAIProviderFactory()
  );
}

export const generateCommand = createGenerateCommand();