import { PDFParser } from '../../infrastructure/parsers/PDFParser.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import { ParseProfile } from '../services/ParseProfile.js';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { Logger } from '../../interfaces/Logger.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class UpdateCommand {
  private parseProfile: ParseProfile;
  private repository: IProfileRepository;
  private logger: Logger;

  constructor(parseProfile: ParseProfile, repository: IProfileRepository, logger: Logger = defaultLogger) {
    this.parseProfile = parseProfile;
    this.repository = repository;
    this.logger = logger;
  }

  async execute(pdfPath: string, lang: 'es' | 'en' = 'es'): Promise<void> {
    try {
      const exists = await this.repository.exists();
      if (!exists) {
        this.logger.log('⚠️  No profile found. Running init instead...');
        const profile = await this.parseProfile.fromPDF(pdfPath, lang);
        this.logger.log(`\n✅ Profile created successfully!`);
        return;
      }

      this.logger.log(`📄 Parsing updated PDF: ${pdfPath}`);
      const profile = await this.parseProfile.fromPDF(pdfPath, lang);
      this.logger.log(`\n✅ Profile updated successfully!`);
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

export function createUpdateCommand(): UpdateCommand {
  const parser = new PDFParser();
  const repository = new JSONProfileRepository();
  const parseProfile = new ParseProfile(parser, repository);
  return new UpdateCommand(parseProfile, repository, defaultLogger);
}

export const updateCommand = createUpdateCommand();