import { PDFParser } from '../../infrastructure/parsers/PDFParser.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import { ParseProfile } from '../services/ParseProfile.js';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { Logger } from '../../interfaces/Logger.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { UpdateConfirmation } from '../../interfaces/UpdateConfirmation.js';
import { InquirerUpdateConfirmation } from '../../infrastructure/confirmation/InquirerUpdateConfirmation.js';
import { createProfileDiff, formatProfileDiff } from '../services/ProfileDiff.js';

export interface UpdateOptions {
  yes?: boolean;
}

export class UpdateCommand {
  private parseProfile: ParseProfile;
  private repository: IProfileRepository;
  private logger: Logger;
  private confirmation: UpdateConfirmation;

  constructor(
    parseProfile: ParseProfile,
    repository: IProfileRepository,
    logger: Logger = defaultLogger,
    confirmation: UpdateConfirmation = new InquirerUpdateConfirmation(),
  ) {
    this.parseProfile = parseProfile;
    this.repository = repository;
    this.logger = logger;
    this.confirmation = confirmation;
  }

  async execute(
    pdfPath: string,
    lang: 'es' | 'en' = 'es',
    options: UpdateOptions = {},
  ): Promise<void> {
    try {
      const exists = await this.repository.exists();
      if (!exists) {
        this.logger.log('⚠️  No profile found. Running init instead...');
        const profile = await this.parseProfile.fromPDF(pdfPath, lang);
        await this.repository.save(profile);
        this.logger.log(`\n✅ Profile created successfully!`);
        return;
      }

      const storedProfile = await this.repository.load();
      if (!storedProfile) {
        throw new DomainError('Stored profile could not be loaded', 'PROFILE_NOT_FOUND');
      }

      this.logger.log(`📄 Parsing updated PDF: ${pdfPath}`);
      const profile = await this.parseProfile.fromPDF(pdfPath, lang);
      this.logger.log(formatProfileDiff(createProfileDiff(storedProfile, profile)));

      if (!options.yes) {
        if (!this.confirmation.isInteractive()) {
          throw new DomainError(
            'Profile update requires confirmation in a non-interactive session',
            'UPDATE_CONFIRMATION_REQUIRED',
            'Run the update again with --yes to approve replacement',
          );
        }

        const confirmed = await this.confirmation.confirm('Replace the current profile?');
        if (!confirmed) {
          this.logger.log('Profile update cancelled.');
          return;
        }
      }

      await this.repository.replace(profile);
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
  const parseProfile = new ParseProfile(parser);
  return new UpdateCommand(
    parseProfile,
    repository,
    defaultLogger,
    new InquirerUpdateConfirmation(),
  );
}

export const updateCommand = createUpdateCommand();
