import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { Logger } from '../../interfaces/Logger.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import * as os from 'os';
import * as path from 'path';

export class ShowProfileCommand {
  private repository: IProfileRepository;
  private logger: Logger;

  constructor(repository: IProfileRepository, logger: Logger = defaultLogger) {
    this.repository = repository;
    this.logger = logger;
  }

  async execute(): Promise<void> {
    try {
      const profile = await this.repository.load();
      if (!profile) {
        throw new DomainError(
          'No profile found. Run "cv init --pdf <path>" first.',
          'PROFILE_NOT_FOUND',
          'Run: cv init --pdf ~/path/to/your/cv.pdf'
        );
      }

      this.logger.log('\n📋 Current Profile:\n');
      this.logger.log(JSON.stringify(profile, null, 2));
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

export class EditProfileCommand {
  private profilePath: string;
  private logger: Logger;

  constructor(profilePath: string = '~/.cv-adapter/profile.json', logger: Logger = defaultLogger) {
    this.profilePath = profilePath;
    this.logger = logger;
  }

  async execute(): Promise<void> {
    const editor = process.env.EDITOR || 'nano';
    this.logger.log(`📝 Opening profile in ${editor}...`);
    this.logger.log(`   Path: ${this.profilePath}`);
    this.logger.log('   Save and close the editor to update.');

    const { exec } = await import('child_process');
    exec(`${editor} ${this.profilePath}`, (error) => {
      if (error) {
        this.logger.error('❌ Error opening editor:', error);
        process.exit(1);
      }
    });
  }
}

export function createShowProfileCommand(): ShowProfileCommand {
  return new ShowProfileCommand(new JSONProfileRepository(), defaultLogger);
}

export function createEditProfileCommand(): EditProfileCommand {
  const home = os.homedir();
  const profilePath = path.join(home, '.cv-adapter', 'profile.json');
  return new EditProfileCommand(profilePath, defaultLogger);
}

export const showProfileCommand = createShowProfileCommand();
export const editProfileCommand = createEditProfileCommand();