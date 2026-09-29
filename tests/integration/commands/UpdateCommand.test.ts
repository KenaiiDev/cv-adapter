import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { ParseProfile } from '../../../src/application/services/ParseProfile.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import type { Profile } from '../../../src/domain/entities/Profile.ts';
import { UpdateCommand } from '../../../src/application/commands/UpdateCommand.ts';
import type { UpdateConfirmation } from '../../../src/interfaces/UpdateConfirmation.ts';

describe('UpdateCommand', () => {
  let mockRepo: MockProxy<IProfileRepository>;
  let mockParseProfile: MockProxy<ParseProfile>;
  let mockLogger: MockProxy<Logger>;
  let mockConfirmation: MockProxy<UpdateConfirmation>;
  let command: UpdateCommand;

  const mockProfile: Profile = {
    name: 'Updated User',
    contact: { email: 'updated@example.com' },
    experience: [],
    education: [],
    skills: [{ category: 'Languages', items: ['TypeScript'] }],
    languages: [],
    updated_at: '2024-01-02',
  };

  beforeEach(() => {
    mockRepo = mock<IProfileRepository>();
    mockParseProfile = mock<ParseProfile>();
    mockLogger = mock<Logger>();
    mockConfirmation = mock<UpdateConfirmation>();
    mockConfirmation.isInteractive.mockReturnValue(true);
    mockConfirmation.confirm.mockResolvedValue(true);
    mockRepo.load.mockResolvedValue(mockProfile);

    command = new UpdateCommand(
      mockParseProfile,
      mockRepo,
      mockLogger,
      mockConfirmation,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should log warning when no profile exists and run init instead', async () => {
    mockRepo.exists.mockResolvedValue(false);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/updated.pdf');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('No profile found'));
    expect(mockParseProfile.fromPDF).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalledWith(mockProfile);
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('✅ Profile created successfully'));
  });

  it('should call parseProfile.fromPDF when profile exists', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/updated.pdf');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('📄 Parsing updated PDF'));
    expect(mockParseProfile.fromPDF).toHaveBeenCalledWith('/path/to/updated.pdf', 'es');
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('✅ Profile updated successfully'));
  });

  it('leaves the profile untouched when an interactive update is declined', async () => {
    const storedProfile = { ...mockProfile, name: 'Current User' };
    mockRepo.exists.mockResolvedValue(true);
    mockRepo.load.mockResolvedValue(storedProfile);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockConfirmation.confirm.mockResolvedValue(false);

    await command.execute('/path/to/updated.pdf');

    expect(mockConfirmation.confirm).toHaveBeenCalledOnce();
    expect(mockRepo.replace).not.toHaveBeenCalled();
  });

  it('leaves the profile untouched when confirmation is cancelled', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockConfirmation.confirm.mockRejectedValue(new Error('Prompt cancelled'));
    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('/path/to/updated.pdf');

    expect(mockRepo.replace).not.toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('shows every changed field path in deterministic order before confirmation', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockRepo.load.mockResolvedValue({
      ...mockProfile,
      name: 'Current User',
      contact: { email: 'current@example.com' },
      skills: [{ category: 'Languages', items: ['JavaScript'] }],
      updated_at: '2024-01-01',
    });
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockConfirmation.confirm.mockResolvedValue(false);

    await command.execute('/path/to/updated.pdf');

    expect(mockLogger.log).toHaveBeenCalledWith([
      'Profile changes:',
      '- contact.email: "current@example.com" -> "updated@example.com"',
      '- name: "Current User" -> "Updated User"',
      '- skills[0].items[0]: "JavaScript" -> "TypeScript"',
      '- updated_at: "2024-01-01" -> "2024-01-02"',
    ].join('\n'));
  });

  it('shows each field path when an array entry is added', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockRepo.load.mockResolvedValue(mockProfile);
    mockParseProfile.fromPDF.mockResolvedValue({
      ...mockProfile,
      experience: [{
        title: 'Developer',
        company: 'Example Co',
        start_date: '2024',
        end_date: '',
        description: '',
      }],
    });
    mockConfirmation.confirm.mockResolvedValue(false);

    await command.execute('/path/to/updated.pdf');

    const diff = mockLogger.log.mock.calls.flat().join('\n');
    expect(diff).toContain('experience[0].company');
    expect(diff).toContain('experience[0].description');
    expect(diff).toContain('experience[0].end_date');
    expect(diff).toContain('experience[0].start_date');
    expect(diff).toContain('experience[0].title');
  });

  it('refuses a non-interactive replacement without explicit approval', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockConfirmation.isInteractive.mockReturnValue(false);
    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('/path/to/updated.pdf');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE_CONFIRMATION_REQUIRED'),
    );
    expect(mockRepo.replace).not.toHaveBeenCalled();
  });

  it('uses explicit approval for a non-interactive replacement', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockConfirmation.isInteractive.mockReturnValue(false);

    await command.execute('/path/to/updated.pdf', 'es', { yes: true });

    expect(mockConfirmation.confirm).not.toHaveBeenCalled();
    expect(mockRepo.replace).toHaveBeenCalledWith(mockProfile);
  });

  it('should use default language es when not specified', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/updated.pdf');

    expect(mockParseProfile.fromPDF).toHaveBeenCalledWith('/path/to/updated.pdf', 'es');
  });

  it('should accept custom language parameter', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/updated.pdf', 'en');

    expect(mockParseProfile.fromPDF).toHaveBeenCalledWith('/path/to/updated.pdf', 'en');
  });

  it('should exit with error on DomainError', async () => {
    const DomainError = (await import('../../../src/domain/errors/DomainError.ts')).DomainError;
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockRejectedValue(new DomainError('Parse failed', 'PARSE_ERROR'));
    mockLogger.error.mockImplementation(() => {});
    mockLogger.log.mockImplementation(() => {});

    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('/path/to/cv.pdf');

    expect(mockLogger.error).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('should handle non-DomainError exceptions', async () => {
    mockRepo.exists.mockResolvedValue(true);
    mockParseProfile.fromPDF.mockRejectedValue(new Error('Unexpected error'));
    mockLogger.error.mockImplementation(() => {});
    mockLogger.log.mockImplementation(() => {});

    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('/path/to/cv.pdf');

    expect(mockLogger.error).toHaveBeenCalledWith('❌ Unexpected error:', expect.any(Error));
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
