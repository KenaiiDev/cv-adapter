import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IParser } from '../../../src/interfaces/IParser.ts';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { ParseProfile } from '../../../src/application/services/ParseProfile.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import { InitCommand } from '../../../src/application/commands/InitCommand.ts';

describe('InitCommand', () => {
  let mockParser: IParser;
  let mockRepo: IProfileRepository;
  let mockParseProfile: ParseProfile;
  let mockLogger: Logger;
  let command: InitCommand;

  const mockProfile = {
    name: 'Test User',
    contact: { email: 'test@example.com' },
    experience: [],
    education: [],
    skills: ['JavaScript'],
    languages: [],
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    mockParser = mock<IParser>();
    mockRepo = mock<IProfileRepository>();
    mockParseProfile = mock<ParseProfile>();
    mockLogger = mock<Logger>();

    command = new InitCommand(mockParseProfile, mockLogger);
  });

  it('should log parsing message and call parseProfile.fromPDF', async () => {
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/cv.pdf');

    expect(mockLogger.log).toHaveBeenCalledWith('📄 Parsing PDF: /path/to/cv.pdf');
    expect(mockParseProfile.fromPDF).toHaveBeenCalledWith('/path/to/cv.pdf', 'es');
  });

  it('should log success message on successful init', async () => {
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/cv.pdf');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('✅ Profile initialized successfully'));
  });

  it('should use default language es when not specified', async () => {
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/cv.pdf');

    expect(mockParseProfile.fromPDF).toHaveBeenCalledWith('/path/to/cv.pdf', 'es');
  });

  it('should accept custom language parameter', async () => {
    mockParseProfile.fromPDF.mockResolvedValue(mockProfile);
    mockLogger.log.mockImplementation(() => {});

    await command.execute('/path/to/cv.pdf', 'en');

    expect(mockParseProfile.fromPDF).toHaveBeenCalledWith('/path/to/cv.pdf', 'en');
  });

  it('should exit with error on DomainError', async () => {
    const DomainError = (await import('../../../src/domain/errors/DomainError.ts')).DomainError;
    mockParseProfile.fromPDF.mockRejectedValue(new DomainError('Parse failed', 'PARSE_ERROR'));
    mockLogger.error.mockImplementation(() => {});
    mockLogger.log.mockImplementation(() => {});

    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('/nonexistent.pdf');

    expect(mockLogger.error).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('should handle non-DomainError exceptions', async () => {
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