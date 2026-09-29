import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'node:crypto';
import { validateProfile, type Profile } from '../../domain/entities/Profile.js';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class JSONProfileRepository implements IProfileRepository {
  constructor(private readonly profilePath = JSONProfileRepository.defaultProfilePath()) {}

  private static defaultProfilePath(): string {
    return path.join(os.homedir(), '.cv-adapter', 'profile.json');
  }

  private getProfilePath(): string {
    return this.profilePath;
  }

  private ensureDir(): void {
    const dataDir = path.dirname(this.profilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async save(profile: Profile): Promise<void> {
    const validProfile = validateProfile(profile);
    this.ensureDir();
    const filePath = this.getProfilePath();
    await fs.promises.writeFile(filePath, JSON.stringify(validProfile, null, 2), 'utf-8');
  }

  async replace(profile: Profile): Promise<void> {
    const validProfile = validateProfile(profile);
    const filePath = this.getProfilePath();
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    const previousBytes = await fs.promises.readFile(filePath);

    try {
      await fs.promises.writeFile(
        temporaryPath,
        JSON.stringify(validProfile, null, 2),
        { encoding: 'utf8', flag: 'wx' },
      );
      await fs.promises.writeFile(`${filePath}.bak`, previousBytes);
      await fs.promises.rename(temporaryPath, filePath);
    } finally {
      await fs.promises.rm(temporaryPath, { force: true });
    }
  }

  async load(): Promise<Profile | null> {
    const filePath = this.getProfilePath();
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    try {
      return validateProfile(JSON.parse(content));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new DomainError(
          `Stored profile contains malformed JSON: ${error.message}`,
          'INVALID_JSON',
          'Restore a valid profile.json or its backup',
        );
      }
      throw error;
    }
  }

  async exists(): Promise<boolean> {
    const filePath = this.getProfilePath();
    return fs.existsSync(filePath);
  }
}

export const profileRepository = new JSONProfileRepository();
