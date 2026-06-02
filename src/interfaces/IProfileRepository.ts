import type { Profile } from '../domain/entities/Profile.js';

export interface IProfileRepository {
  save(profile: Profile): Promise<void>;
  load(): Promise<Profile | null>;
  exists(): Promise<boolean>;
}