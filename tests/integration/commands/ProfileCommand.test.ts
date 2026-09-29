import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { exec, type ChildProcess, type ExecException } from 'child_process';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import type { Profile } from '../../../src/domain/entities/Profile.ts';
import { ShowProfileCommand, EditProfileCommand } from '../../../src/application/commands/ProfileCommand.ts';

vi.mock('child_process', () => ({ exec: vi.fn() }));

type EditorExec = (
  command: string,
  callback?: (error: ExecException | null, stdout: string, stderr: string) => void,
) => ChildProcess;

describe('ProfileCommand', () => {
  describe('ShowProfileCommand', () => {
    let mockRepo: MockProxy<IProfileRepository>;
    let mockLogger: MockProxy<Logger>;
    let command: ShowProfileCommand;

    const mockProfile: Profile = {
      name: 'John Doe',
      contact: { email: 'john@example.com' },
      summary: 'Experienced developer',
      experience: [{
        title: 'Developer',
        company: 'Tech Co',
        start_date: '2020',
        end_date: '2021',
        description: 'Built things',
      }],
      education: [{
        degree: 'CS Degree',
        institution: 'University',
        year: '2019',
      }],
      skills: [{ category: 'Languages', items: ['JavaScript', 'TypeScript'] }],
      languages: [{ language: 'English', level: 'Fluent' }],
      updated_at: '2024-01-01',
    };

    beforeEach(() => {
      mockRepo = mock<IProfileRepository>();
      mockLogger = mock<Logger>();
      command = new ShowProfileCommand(mockRepo, mockLogger);
    });

    it('should output profile JSON when profile exists', async () => {
      mockRepo.load.mockResolvedValue(mockProfile);
      mockLogger.log.mockImplementation(() => {});

      await command.execute();

      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('📋 Current Profile'));
      expect(mockLogger.log).toHaveBeenCalledWith(JSON.stringify(mockProfile, null, 2));
    });

    it('should exit with error when profile not found', async () => {
      mockRepo.load.mockResolvedValue(null);
      mockLogger.error.mockImplementation(() => {});
      mockLogger.log.mockImplementation(() => {});

      const exitMock = vi.fn();
      vi.stubGlobal('process', { ...process, exit: exitMock });

      await command.execute();

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('No profile found'));
      expect(exitMock).toHaveBeenCalledWith(1);
    });

    it('should format JSON with indentation', async () => {
      mockRepo.load.mockResolvedValue(mockProfile);
      mockLogger.log.mockImplementation(() => {});

      await command.execute();

      const jsonCall = mockLogger.log.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('"name":')
      );
      expect(jsonCall).toBeDefined();
    });
  });

  describe('EditProfileCommand', () => {
    let mockLogger: MockProxy<Logger>;
    let command: EditProfileCommand;

    beforeEach(() => {
      vi.unstubAllGlobals();
      mockLogger = mock<Logger>();
      command = new EditProfileCommand('~/.cv-adapter/profile.json', mockLogger);
    });

    it('should print editor information', async () => {
      mockLogger.log.mockImplementation(() => {});

      const execMock = vi.fn();
      vi.stubGlobal('process', { ...process, exec: execMock });

      await command.execute();

      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('📝 Opening profile in'));
      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Path:'));
      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('.cv-adapter/profile.json'));
    });

    it('should use default editor nano when EDITOR env not set', async () => {
      mockLogger.log.mockImplementation(() => {});

      const execMock = vi.fn();
      vi.stubGlobal('process', { ...process, exec: execMock, env: {} });

      await command.execute();

      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('nano'));
    });

    it('should use custom EDITOR when set in env', async () => {
      mockLogger.log.mockImplementation(() => {});

      const execMock = vi.fn();
      vi.stubGlobal('process', { ...process, exec: execMock, env: { EDITOR: 'vim' } });

      await command.execute();

      expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('vim'));
    });

    it('should exit with error when editor fails', async () => {
      mockLogger.log.mockImplementation(() => {});
      mockLogger.error.mockImplementation(() => {});

      const execMock = vi.mocked(exec) as unknown as Mock<EditorExec>;
      const editorFailure = new Error('Editor not found');
      let reportEditorFailure: () => void;
      const editorFailureReported = new Promise<void>(resolve => {
        reportEditorFailure = resolve;
      });
      execMock.mockImplementation((_command, callback) => {
        queueMicrotask(() => {
          callback?.(editorFailure, '', '');
          reportEditorFailure();
        });
        return undefined as unknown as ChildProcess;
      });

      const exitMock = vi.fn();
      vi.stubGlobal('process', { ...process, env: { ...process.env, EDITOR: 'nano' }, exit: exitMock });

      await command.execute();
      await editorFailureReported;

      expect(execMock).toHaveBeenCalledWith('nano ~/.cv-adapter/profile.json', expect.any(Function));
      expect(mockLogger.error).toHaveBeenCalled();
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });
});
