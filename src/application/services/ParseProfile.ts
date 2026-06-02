import * as fs from 'fs';
import type { Profile } from '../../domain/entities/Profile.js';
import type { IParser } from '../../interfaces/IParser.js';
import type { IProfileRepository } from '../../interfaces/IProfileRepository.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class ParseProfile {
  constructor(
    private parser: IParser,
    private repository: IProfileRepository
  ) {}

  async fromPDF(filePath: string, lang: 'es' | 'en' = 'es'): Promise<Profile> {
    if (!fs.existsSync(filePath)) {
      throw new DomainError(
        `File not found: ${filePath}`,
        'FILE_NOT_FOUND',
        'Check the path to your PDF file'
      );
    }

    const text = await this.parser.parse(filePath);

    const name = this.extractName(text);

    const profile = this.parser.toProfile(text, name);

    await this.repository.save(profile);

    console.log(`✅ Profile saved to ~/.cv-adapter/profile.json`);
    console.log(`   Name: ${profile.name}`);
    console.log(`   Experience: ${profile.experience.length} entries`);
    console.log(`   Skills: ${profile.skills.length} items`);

    return profile;
  }

  private extractName(text: string): string {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return 'Unknown';

    const firstLine = lines[0].trim();

    if (firstLine.includes('@') || firstLine.includes('http')) {
      return lines.length > 1 ? lines[1].trim() : 'Unknown';
    }

    return firstLine;
  }
}