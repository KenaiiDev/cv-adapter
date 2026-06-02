import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { ParseProfile } from '../../../src/application/services/ParseProfile.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import { UpdateCommand } from '../../../src/application/commands/UpdateCommand.ts';

describe('UpdateCommand', () => {
  let mockRepo: IProfileRepository;
  let mockParseProfile: ParseProfile;
  let mockLogger: Logger;
  let command: UpdateCommand;

  const mockProfile = {
    name: 'Updated User',
    contact: { email: 'updated@example.com' },
    experience: [],
    education: [],
    skills: ['TypeScript'],
    languages: [],
    updated_at: '2024-01-02',
  };

  beforeEach(() => {
    mockRepo = mock<IProfileRepository>();
    mockParseProfile = mock<ParseProfile>();
    mockLogger = mock<Logger>();

    command = new UpdateCommand(mockParseProfile, mockRepo, mockLogger);
  });

  it('should log warning when no profile exists and run init instead', async () => {
    mockRepo.exists.mockResolvedValue(false);
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/updated.pdf');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('No profile found'));
    expect(mockParseProfile.fromPDF).toHaveBeenCalled();
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