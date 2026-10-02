import * as path from 'path';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { IAIProvider, Language } from '../../interfaces/IAIProvider.js';
import type { Logger } from '../../interfaces/Logger.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { GenerateCV } from '../services/GenerateCV.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { IPDFGenerator } from '../../interfaces/IPDFGenerator.js';
import type { GeneratedCVReview } from '../../interfaces/GeneratedCVReview.js';
import type { GeneratePrompts } from '../../interfaces/GeneratePrompts.js';
import type { FileWriter } from '../../interfaces/FileWriter.js';

export class GenerateCommand {
  constructor(
    private readonly repository: IProfileRepository,
    private readonly aiProviderFactory: () => IAIProvider,
    private readonly review: GeneratedCVReview,
    private readonly prompts: GeneratePrompts,
    private readonly pdfGenerator: IPDFGenerator,
    private readonly fileWriter: FileWriter,
    private readonly logger: Logger = defaultLogger,
  ) {}

  async execute(vacancy: string, language?: Language): Promise<void> {
    try {
      if (!this.review.isInteractive()) {
        this.logger.log('Generated CV cancelled: interactive approval is required.');
        return;
      }

      const profile = await this.repository.load();
      if (!profile) {
        throw new DomainError(
          'No profile found. Run "cv init --pdf <path>" first.',
          'PROFILE_NOT_FOUND',
          'Run: cv init --pdf ~/path/to/your/cv.pdf'
        );
      }

      const lang: Language = language || await this.prompts.requestLanguage();
      const aiProvider = this.aiProviderFactory();
      const generateCV = new GenerateCV(aiProvider);

      this.logger.log(`\n🎯 Vacancy: ${vacancy.substring(0, 80)}...`);
      this.logger.log(`🌐 Language: ${lang === 'es' ? 'Spanish' : 'English'}`);

      this.logger.log('\n📝 Generating CV...');
      const cvData = await generateCV.execute(profile, vacancy, lang);

      this.logger.log('✅ CV generated successfully');

      const approved = await this.review.review(cvData);
      if (!approved) {
        this.logger.log('Generated CV cancelled.');
        return;
      }

      const filename = await this.prompts.requestFilename();

      this.logger.log('📄 Generating PDF...');
      const buffer = await this.pdfGenerator.generate(cvData, lang);

      const outputPath = path.resolve(process.cwd(), `${filename}.pdf`);
      await this.fileWriter.write(outputPath, buffer);

      this.logger.log(`✅ PDF saved to: ${outputPath}`);
    } catch (error) {
      if (error instanceof DomainError) {
        this.logger.error(error.toString());
      } else {
        this.logger.error('❌ Unexpected error:', error);
      }
      process.exit(1);
    }
  }

}
