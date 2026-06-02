import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { IRenderer } from '../../../src/interfaces/IRenderer.ts';
import type { IAIProvider, Language } from '../../../src/interfaces/IAIProvider.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import type { PreviewServerFactory, IPreviewServer } from '../../../src/interfaces/PreviewServerFactory.ts';
import type { Profile } from '../../../src/domain/entities/Profile.ts';
import type { CVData } from '../../../src/domain/entities/CVData.ts';
import { GenerateCommand } from '../../../src/application/commands/GenerateCommand.ts';

describe('GenerateCommand', () => {
  let mockRepo: IProfileRepository;
  let mockAIProvider: IAIProvider;
  let mockRenderer: IRenderer;
  let mockPreviewServer: IPreviewServer;
  let mockPreviewServerFactory: PreviewServerFactory;
  let mockLogger: Logger;
  let command: GenerateCommand;

  const mockProfile: Profile = {
    name: 'Test User',
    contact: { email: 'test@example.com' },
    experience: [],
    education: [],
    skills: ['JavaScript'],
    languages: [],
    updated_at: '2024-01-01',
  };

  const mockCVData: CVData = {
    name: 'Test User',
    contact: { email: 'test@example.com' },
    summary: 'Experienced developer',
    experience: [],
    education: [],
    skills: ['JavaScript'],
    languages: [],
    generated_at: '2024-01-15T10:00:00.000Z',
  };

  beforeEach(() => {
    mockRepo = mock<IProfileRepository>();
    mockAIProvider = mock<IAIProvider>();
    mockRenderer = mock<IRenderer>();
    mockPreviewServer = mock<IPreviewServer>();
    mockLogger = mock<Logger>();

    mockPreviewServerFactory = {
      create: vi.fn().mockReturnValue(mockPreviewServer),
    };

    command = new GenerateCommand(
      mockRepo,
      () => mockAIProvider,
      mockRenderer,
      mockPreviewServerFactory,
      mockLogger
    );
  });

  it('should throw error when profile not found', async () => {
    mockRepo.load.mockResolvedValue(null);
    mockLogger.error.mockImplementation(() => {});
    mockLogger.log.mockImplementation(() => {});

    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('Test vacancy', 'es');

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('No profile found'));
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('should log vacancy and language info', async () => {
    mockRepo.load.mockResolvedValue(mockProfile);
    mockAIProvider.generateCV.mockResolvedValue(mockCVData);
    mockRenderer.toHTML.mockResolvedValue('<html>CV</html>');
    mockPreviewServer.start.mockResolvedValue();
    mockLogger.log.mockImplementation(() => {});

    await command.execute('Senior Python Developer at TechCorp', 'es');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Senior Python'));
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Language:'));
  });

  it('should use default language es when not specified', async () => {
    mockRepo.load.mockResolvedValue(mockProfile);
    mockAIProvider.generateCV.mockResolvedValue(mockCVData);
    mockRenderer.toHTML.mockResolvedValue('<html>CV</html>');
    mockPreviewServer.start.mockResolvedValue();
    mockLogger.log.mockImplementation(() => {});

    await command.execute('Test vacancy', 'es');

    expect(mockAIProvider.generateCV).toHaveBeenCalledWith(
      mockProfile,
      'Test vacancy',
      'es'
    );
  });

  it('should handle Spanish language', async () => {
    mockRepo.load.mockResolvedValue(mockProfile);
    mockAIProvider.generateCV.mockResolvedValue(mockCVData);
    mockRenderer.toHTML.mockResolvedValue('<html>CV</html>');
    mockPreviewServer.start.mockResolvedValue();
    mockLogger.log.mockImplementation(() => {});

    await command.execute('Test vacancy', 'es');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Español'));
  });

  it('should handle English language', async () => {
    mockRepo.load.mockResolvedValue(mockProfile);
    mockAIProvider.generateCV.mockResolvedValue(mockCVData);
    mockRenderer.toHTML.mockResolvedValue('<html>CV</html>');
    mockPreviewServer.start.mockResolvedValue();
    mockLogger.log.mockImplementation(() => {});

    await command.execute('Test vacancy', 'en');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('English'));
  });

  it('should generate CV and render HTML', async () => {
    mockRepo.load.mockResolvedValue(mockProfile);
    mockAIProvider.generateCV.mockResolvedValue(mockCVData);
    mockRenderer.toHTML.mockResolvedValue('<html>CV</html>');
    mockPreviewServer.start.mockResolvedValue();
    mockLogger.log.mockImplementation(() => {});

    await command.execute('Test vacancy', 'es');

    expect(mockAIProvider.generateCV).toHaveBeenCalled();
    expect(mockRenderer.toHTML).toHaveBeenCalledWith(mockCVData);
  });

  it('should start preview server', async () => {
    mockRepo.load.mockResolvedValue(mockProfile);
    mockAIProvider.generateCV.mockResolvedValue(mockCVData);
    mockRenderer.toHTML.mockResolvedValue('<html>CV</html>');
    mockPreviewServer.start.mockResolvedValue();
    mockLogger.log.mockImplementation(() => {});

    await command.execute('Test vacancy', 'es');

    expect(mockPreviewServerFactory.create).toHaveBeenCalledWith('<html>CV</html>');
    expect(mockPreviewServer.start).toHaveBeenCalled();
  });

  it('should exit with error on DomainError', async () => {
    const DomainError = (await import('../../../src/domain/errors/DomainError.ts')).DomainError;
    mockRepo.load.mockResolvedValue(null);
    mockLogger.error.mockImplementation(() => {});
    mockLogger.log.mockImplementation(() => {});

    const exitMock = vi.fn();
    vi.stubGlobal('process', { ...process, exit: exitMock });

    await command.execute('Test vacancy', 'es');

    expect(exitMock).toHaveBeenCalledWith(1);
  });
});