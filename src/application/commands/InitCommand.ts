import { PDFParser } from '../../infrastructure/parsers/PDFParser.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import { ParseProfile } from '../services/ParseProfile.js';
import type { Logger } from '../../interfaces/Logger.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class InitCommand {
  private parseProfile: ParseProfile;
  private logger: Logger;

  constructor(parseProfile: ParseProfile, logger: Logger = defaultLogger) {
    this.parseProfile = parseProfile;
    this.logger = logger;
  }

  async execute(pdfPath: string, lang: 'es' | 'en' = 'es'): Promise<void> {
    try {
      this.logger.log(`📄 Parsing PDF: ${pdfPath}`);
      const profile = await this.parseProfile.fromPDF(pdfPath, lang);
      this.logger.log(`\n✅ Profile initialized successfully!`);
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

export function createInitCommand(): InitCommand {
  const parser = new PDFParser();
  const repository = new JSONProfileRepository();
  const parseProfile = new ParseProfile(parser, repository);
  return new InitCommand(parseProfile, defaultLogger);
}

export const initCommand = createInitCommand();