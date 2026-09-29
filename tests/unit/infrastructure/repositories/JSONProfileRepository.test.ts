import { promises as fsPromises } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '../../../../src/domain/errors/DomainError.ts';
import { JSONProfileRepository } from '../../../../src/infrastructure/repositories/JSONProfileRepository.ts';
import { createEmptyProfile } from '../../../../src/domain/entities/Profile.ts';

describe('JSONProfileRepository', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(temporaryDirectories.splice(0).map(directory => (
      rm(directory, { recursive: true, force: true })
    )));
  });

  async function createRepository(): Promise<{
    profilePath: string;
    repository: JSONProfileRepository;
  }> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'cv-adapter-profile-'));
    temporaryDirectories.push(directory);
    const profilePath = path.join(directory, 'profile.json');
    return {
      profilePath,
      repository: new JSONProfileRepository(profilePath),
    };
  }

  it('reports malformed stored JSON as a domain error', async () => {
    const { profilePath, repository } = await createRepository();
    await writeFile(profilePath, '{not json', 'utf8');

    await expect(repository.load()).rejects.toMatchObject({
      code: 'INVALID_JSON',
    } satisfies Partial<DomainError>);
  });

  it('reports structurally invalid stored profile data as a domain error', async () => {
    const { profilePath, repository } = await createRepository();
    await writeFile(profilePath, JSON.stringify({ name: 'Incomplete' }), 'utf8');

    await expect(repository.load()).rejects.toMatchObject({
      code: 'INVALID_PROFILE',
    } satisfies Partial<DomainError>);
  });

  it('replaces the profile atomically and keeps an exact rolling backup', async () => {
    const { profilePath, repository } = await createRepository();
    const previousBytes = `${JSON.stringify(createEmptyProfile())}\n`;
    const candidate = { ...createEmptyProfile(), name: 'Updated User' };
    await writeFile(profilePath, previousBytes, 'utf8');

    await repository.replace(candidate);

    expect(await readFile(`${profilePath}.bak`, 'utf8')).toBe(previousBytes);
    expect(await repository.load()).toEqual(candidate);
    expect((await readdir(path.dirname(profilePath))).sort()).toEqual([
      'profile.json',
      'profile.json.bak',
    ]);
  });

  it('preserves the original profile and cleans up when atomic rename fails', async () => {
    const { profilePath, repository } = await createRepository();
    const previousBytes = `${JSON.stringify(createEmptyProfile())}\n`;
    await writeFile(profilePath, previousBytes, 'utf8');
    vi.spyOn(fsPromises, 'rename').mockRejectedValue(new Error('rename failed'));

    await expect(repository.replace({
      ...createEmptyProfile(),
      name: 'Updated User',
    })).rejects.toThrow('rename failed');

    expect(await readFile(profilePath, 'utf8')).toBe(previousBytes);
    expect((await readdir(path.dirname(profilePath))).sort()).toEqual([
      'profile.json',
      'profile.json.bak',
    ]);
  });
});
