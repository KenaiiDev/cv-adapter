import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Profile } from '../../domain/entities/Profile.js';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';

export class JSONProfileRepository implements IProfileRepository {
  private getProfilePath(): string {
    const homeDir = os.homedir();
    const dataDir = path.join(homeDir, '.cv-adapter');
    return path.join(dataDir, 'profile.json');
  }

  private ensureDir(): void {
    const homeDir = os.homedir();
    const dataDir = path.join(homeDir, '.cv-adapter');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async save(profile: Profile): Promise<void> {
    this.ensureDir();
    const filePath = this.getProfilePath();
    await fs.promises.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
  }

  async load(): Promise<Profile | null> {
    const filePath = this.getProfilePath();
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Profile;
  }

  async exists(): Promise<boolean> {
    const filePath = this.getProfilePath();
    return fs.existsSync(filePath);
  }
}

export const profileRepository = new JSONProfileRepository();