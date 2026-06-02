import type { Profile } from '../domain/entities/Profile.js';

export interface IParser {
  parse(filePath: string): Promise<string>;
  toProfile(text: string, name: string): Profile;
}