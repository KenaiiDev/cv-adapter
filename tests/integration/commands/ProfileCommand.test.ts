import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import type { Profile } from '../../../src/domain/entities/Profile.ts';
import type { UpdateConfirmation } from '../../../src/interfaces/UpdateConfirmation.ts';
import type { EditorProcess } from '../../../src/infrastructure/process/EditorProcess.ts';
import { EditorProcess as RuntimeEditorProcess } from '../../../src/infrastructure/process/EditorProcess.ts';
import { EditProfileCommand, ShowProfileCommand } from '../../../src/application/commands/ProfileCommand.ts';

describe('ProfileCommand', () => {
  const profile: Profile = {
    name: 'Current User',
    contact: { email: 'current@example.com' },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    updated_at: '2024-01-01',
  };
  let repository: MockProxy<IProfileRepository>;
  let logger: MockProxy<Logger>;
  let confirmation: MockProxy<UpdateConfirmation>;
  let editor: MockProxy<EditorProcess>;
  let temporaryDirectory: string;
  let command: EditProfileCommand;

  beforeEach(async () => {
    repository = mock<IProfileRepository>();
    logger = mock<Logger>();
    confirmation = mock<UpdateConfirmation>();
    editor = mock<EditorProcess>();
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'cv-adapter-profile-command-'));
    repository.load.mockResolvedValue(profile);
    confirmation.isInteractive.mockReturnValue(true);
    confirmation.confirm.mockResolvedValue(true);
    command = new EditProfileCommand(join(temporaryDirectory, 'profile.json'), repository, editor, logger, confirmation);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('stages the live profile, awaits the editor, and replaces only the accepted candidate', async () => {
    vi.stubEnv('EDITOR', 'nano');
    const candidate = { ...profile, name: 'Edited User' };
    let releaseEditor: (() => void) | undefined;
    const editorFinished = new Promise<void>(resolve => { releaseEditor = resolve; });
    editor.execute.mockImplementation(async (_executable, [stagedPath]) => {
      await writeFile(stagedPath, JSON.stringify(candidate));
      await editorFinished;
    });

    const execution = command.execute();
    await vi.waitFor(() => expect(editor.execute).toHaveBeenCalledOnce());
    expect(repository.replace).not.toHaveBeenCalled();
    releaseEditor?.();
    await execution;

    const stagedPath = editor.execute.mock.calls[0][1][0];
    await expect(readFile(stagedPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    expect(editor.execute).toHaveBeenCalledWith('nano', [stagedPath]);
    expect(repository.replace).toHaveBeenCalledWith(candidate);
    expect(logger.log).toHaveBeenCalledWith([
      'Profile changes:',
      '- name: "Current User" -> "Edited User"',
    ].join('\n'));
  });

  it('preserves the live profile when the editor fails', async () => {
    editor.execute.mockRejectedValue(new Error('editor failed'));
    const exit = vi.fn();
    vi.stubGlobal('process', { ...process, exit });

    await command.execute();

    expect(repository.replace).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('awaits a real editor process before replacing the staged candidate', async () => {
    vi.stubEnv('EDITOR', process.execPath);
    const exit = vi.fn();
    vi.stubGlobal('process', { ...process, exit });
    const runtimeCommand = new EditProfileCommand(
      join(temporaryDirectory, 'profile.json'),
      repository,
      new RuntimeEditorProcess(),
      logger,
      confirmation,
    );

    await runtimeCommand.execute();

    expect(repository.replace).toHaveBeenCalledWith(profile);
    expect(exit).not.toHaveBeenCalled();
  });

  it('preserves the live profile when the edited JSON is invalid', async () => {
    editor.execute.mockImplementation(async (_executable, [stagedPath]) => {
      await writeFile(stagedPath, '{');
    });
    const exit = vi.fn();
    vi.stubGlobal('process', { ...process, exit });

    await command.execute();

    expect(repository.replace).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('preserves the live profile when the staged edit is declined', async () => {
    confirmation.confirm.mockResolvedValue(false);
    editor.execute.mockImplementation(async (_executable, [stagedPath]) => {
      await writeFile(stagedPath, JSON.stringify({ ...profile, name: 'Edited User' }));
    });

    await command.execute();

    expect(repository.replace).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('Profile update cancelled.');
  });

  it('refuses non-interactive staged replacement without --yes', async () => {
    confirmation.isInteractive.mockReturnValue(false);
    editor.execute.mockImplementation(async (_executable, [stagedPath]) => {
      await writeFile(stagedPath, JSON.stringify({ ...profile, name: 'Edited User' }));
    });
    const exit = vi.fn();
    vi.stubGlobal('process', { ...process, exit });

    await command.execute();

    expect(repository.replace).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('UPDATE_CONFIRMATION_REQUIRED'));
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('shows an existing profile', async () => {
    const show = new ShowProfileCommand(repository, logger);

    await show.execute();

    expect(logger.log).toHaveBeenCalledWith(JSON.stringify(profile, null, 2));
  });
});
