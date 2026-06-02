import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import { ShowProfileCommand, EditProfileCommand } from '../../../src/application/commands/ProfileCommand.ts';

describe('ProfileCommand', () => {
  describe('ShowProfileCommand', () => {
    let mockRepo: IProfileRepository;
    let mockLogger: Logger;
    let command: ShowProfileCommand;

    const mockProfile = {
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
      skills: ['JavaScript', 'TypeScript'],
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
    let mockLogger: Logger;
    let command: EditProfileCommand;

    beforeEach(() => {
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

      const execMock = vi.fn((cmd: string, callback: (error: Error | null) => void) => {
        setTimeout(() => callback(new Error('Editor not found')), 0);
      });

      const exitMock = vi.fn();
      vi.stubGlobal('process', { ...process, exec: execMock, exit: exitMock });

      await command.execute();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockLogger.error).toHaveBeenCalled();
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });
});