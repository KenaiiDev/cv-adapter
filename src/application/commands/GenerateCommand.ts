import * as dotenv from 'dotenv';
import * as readline from 'readline';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { IRenderer } from '../../interfaces/IRenderer.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';
import type { Logger } from '../../interfaces/Logger.js';
import type { PreviewServerFactory } from '../../interfaces/PreviewServerFactory.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { GenerateCV } from '../services/GenerateCV.js';
import { RenderCV } from '../services/RenderCV.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import { EJSRenderer } from '../../infrastructure/renderer/EJSRenderer.js';
import { GroqAI } from '../../infrastructure/ai/GroqAI.js';
import { GeminiAI } from '../../infrastructure/ai/GeminiAI.js';
import { OpenAIProvider } from '../../infrastructure/ai/OpenAI.js';
import { AnthropicAI } from '../../infrastructure/ai/AnthropicAI.js';
import { OllamaAI } from '../../infrastructure/ai/OllamaAI.js';

dotenv.config();

export class GenerateCommand {
  private repository: IProfileRepository;
  private aiProviderFactory: () => IAIProvider;
  private renderer: IRenderer;
  private previewServerFactory: PreviewServerFactory;
  private logger: Logger;

  constructor(
    repository: IProfileRepository,
    aiProviderFactory: () => IAIProvider,
    renderer: IRenderer,
    previewServerFactory: PreviewServerFactory,
    logger: Logger = defaultLogger
  ) {
    this.repository = repository;
    this.aiProviderFactory = aiProviderFactory;
    this.renderer = renderer;
    this.previewServerFactory = previewServerFactory;
    this.logger = logger;
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

      this.logger.log(`\n🎯 Vacancy: ${vacancy.substring(0, 80)}...`);
      this.logger.log(`🌐 Language: ${lang === 'es' ? 'Español' : 'English'}`);

      const cvData = await generateCV.execute(profile, vacancy, lang);

      const renderCV = new RenderCV(this.renderer);
      const html = await renderCV.toHTML(cvData);

      this.logger.log('\n📝 Opening preview in browser...');
      const server = this.previewServerFactory.create(html);
      await server.start();
    } catch (error) {
      if (error instanceof DomainError) {
        this.logger.error(error.toString());
      } else {
        this.logger.error('❌ Unexpected error:', error);
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

export function createPreviewServerFactory(): PreviewServerFactory {
  return {
    create(html: string) {
      return {
        async start() {
          const expressModule = await import('express');
          const express = expressModule.default;
          const app = express();

          app.use(express.static('.'));

          app.get('/', (_req: any, res: any) => {
            res.send(html);
          });

          app.get('/download', async (_req: any, res: any) => {
            try {
              const htmlPdfModule = await import('html-pdf-node');
              const file = { content: html };

              const options = {
                format: 'A4' as const,
                printBackground: true,
                margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
              };

              const buffer = await htmlPdfModule.fileToPdf(file, options);
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename="CV-generado.pdf"');
              res.send(buffer);
            } catch (error) {
              res.status(500).send('Error generating PDF');
            }
          });

          const PORT = 8080;
          const server = app.listen(PORT, async () => {
            console.log(`   Preview: http://localhost:${PORT}`);
            console.log(`   Click "Descargar PDF" button to save`);
            console.log(`   Press Ctrl+C to stop server`);

            const openModule = await import('open');
            const open = openModule.default;
            await open(`http://localhost:${PORT}`);
          });

          process.on('SIGINT', () => {
            server.close(() => process.exit(0));
          });
        },
        stop() {
          process.exit(0);
        }
      };
    }
  };
}

export function createGenerateCommand(): GenerateCommand {
  return new GenerateCommand(
    new JSONProfileRepository(),
    createAIProviderFactory(),
    new EJSRenderer(),
    createPreviewServerFactory(),
    defaultLogger
  );
}

export const generateCommand = createGenerateCommand();