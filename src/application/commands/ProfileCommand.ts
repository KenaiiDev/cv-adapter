import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import type { Logger } from '../../interfaces/Logger.js';
import { defaultLogger } from '../../interfaces/Logger.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { JSONProfileRepository } from '../../infrastructure/repositories/JSONProfileRepository.js';
import { EditorProcess } from '../../infrastructure/process/EditorProcess.js';
import { InquirerUpdateConfirmation } from '../../infrastructure/confirmation/InquirerUpdateConfirmation.js';
import { createProfileDiff, formatProfileDiff } from '../services/ProfileDiff.js';
import { validateProfile } from '../../domain/entities/Profile.js';
import type { UpdateConfirmation } from '../../interfaces/UpdateConfirmation.js';
import * as os from 'os';
import * as path from 'path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';

export interface EditProfileOptions {
  yes?: boolean;
}

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
  constructor(
    private readonly profilePath: string,
    private readonly repository: IProfileRepository,
    private readonly editorProcess: EditorProcess,
    private readonly logger: Logger = defaultLogger,
    private readonly confirmation: UpdateConfirmation = new InquirerUpdateConfirmation(),
  ) {}

  async execute(options: EditProfileOptions = {}): Promise<void> {
    const editor = process.env.EDITOR || 'nano';
    let stagingDirectory: string | undefined;
    try {
      const currentProfile = await this.repository.load();
      if (!currentProfile) {
        throw new DomainError(
          'No profile found. Run "cv init --pdf <path>" first.',
          'PROFILE_NOT_FOUND',
          'Run: cv init --pdf ~/path/to/your/cv.pdf',
        );
      }

      stagingDirectory = await mkdtemp(path.join(path.dirname(this.profilePath), '.profile-edit-'));
      const stagedPath = path.join(stagingDirectory, 'profile.json');
      await writeFile(stagedPath, JSON.stringify(currentProfile, null, 2), {
        encoding: 'utf8', flag: 'wx', mode: 0o600,
      });
      this.logger.log(`📝 Opening staged profile in ${editor}...`);
      this.logger.log('   Save and close the editor to review changes.');
      await this.editorProcess.execute(editor, [stagedPath]);

      const candidate = validateProfile(JSON.parse(await readFile(stagedPath, 'utf8')));
      this.logger.log(formatProfileDiff(createProfileDiff(currentProfile, candidate)));
      if (!options.yes) {
        if (!this.confirmation.isInteractive()) {
          throw new DomainError(
            'Profile update requires confirmation in a non-interactive session',
            'UPDATE_CONFIRMATION_REQUIRED',
            'Run the edit again with --yes to approve replacement',
          );
        }
        if (!await this.confirmation.confirm('Replace the current profile?')) {
          this.logger.log('Profile update cancelled.');
          return;
        }
      }
      await this.repository.replace(candidate);
      this.logger.log('\n✅ Profile updated successfully!');
    } catch (error) {
      if (error instanceof DomainError) this.logger.error(error.toString());
      else this.logger.error('❌ Unexpected error:', error);
      process.exit(1);
    } finally {
      if (stagingDirectory) await rm(stagingDirectory, { recursive: true, force: true });
    }
  }
}

export function createShowProfileCommand(): ShowProfileCommand {
  return new ShowProfileCommand(new JSONProfileRepository(), defaultLogger);
}

export function createEditProfileCommand(): EditProfileCommand {
  const home = os.homedir();
  const profilePath = path.join(home, '.cv-adapter', 'profile.json');
  return new EditProfileCommand(
    profilePath,
    new JSONProfileRepository(profilePath),
    new EditorProcess(),
    defaultLogger,
    new InquirerUpdateConfirmation(),
  );
}

export const showProfileCommand = createShowProfileCommand();
export const editProfileCommand = createEditProfileCommand();
