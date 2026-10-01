import { beforeEach, describe, expect, it } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { GenerateCommand } from '../../../src/application/commands/GenerateCommand.ts';
import type { IAIProvider } from '../../../src/interfaces/IAIProvider.ts';
import type { IProfileRepository } from '../../../src/interfaces/IProfileRepository.ts';
import type { GeneratedCVReview } from '../../../src/interfaces/GeneratedCVReview.ts';
import type { GeneratePrompts } from '../../../src/interfaces/GeneratePrompts.ts';
import type { IPDFGenerator } from '../../../src/interfaces/IPDFGenerator.ts';
import type { FileWriter } from '../../../src/interfaces/FileWriter.ts';
import type { Logger } from '../../../src/interfaces/Logger.ts';
import type { CVData } from '../../../src/domain/entities/CVData.ts';
import type { Profile } from '../../../src/domain/entities/Profile.ts';

describe('GenerateCommand', () => {
  let repository: MockProxy<IProfileRepository>;
  let aiProvider: MockProxy<IAIProvider>;
  let review: MockProxy<GeneratedCVReview>;
  let prompts: MockProxy<GeneratePrompts>;
  let pdfGenerator: MockProxy<IPDFGenerator>;
  let fileWriter: MockProxy<FileWriter>;
  let logger: MockProxy<Logger>;
  let command: GenerateCommand;

  const profile: Profile = {
    name: 'Ada Lovelace',
    contact: { email: 'ada@example.com' },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    updated_at: '2024-01-01',
  };
  const cvData: CVData = {
    ...profile,
    summary: 'Mathematician and software pioneer.',
    generated_at: '2024-02-01T00:00:00.000Z',
  };

  beforeEach(() => {
    repository = mock<IProfileRepository>();
    aiProvider = mock<IAIProvider>();
    review = mock<GeneratedCVReview>();
    prompts = mock<GeneratePrompts>();
    pdfGenerator = mock<IPDFGenerator>();
    fileWriter = mock<FileWriter>();
    logger = mock<Logger>();

    repository.load.mockResolvedValue(profile);
    aiProvider.generateCV.mockResolvedValue(cvData);
    review.isInteractive.mockReturnValue(true);
    review.review.mockResolvedValue(true);
    prompts.requestFilename.mockResolvedValue('ada-cv');
    pdfGenerator.generate.mockResolvedValue(Buffer.from('pdf'));

    command = new GenerateCommand(
      repository,
      () => aiProvider,
      review,
      prompts,
      pdfGenerator,
      fileWriter,
      logger,
    );
  });

  it('writes a PDF only after an interactive reviewer approves the generated CV', async () => {
    await command.execute('Software engineer vacancy', 'en');

    expect(review.review).toHaveBeenCalledWith(cvData);
    expect(prompts.requestFilename).toHaveBeenCalledOnce();
    expect(pdfGenerator.generate).toHaveBeenCalledWith(cvData, 'en');
    expect(fileWriter.write).toHaveBeenCalledWith(
      expect.stringMatching(/ada-cv\.pdf$/),
      Buffer.from('pdf'),
    );
  });

  it('cancels without prompting for a filename, generating a PDF, or writing a file when review is declined', async () => {
    review.review.mockResolvedValue(false);

    await command.execute('Software engineer vacancy', 'en');

    expect(logger.log).toHaveBeenCalledWith('Generated CV cancelled.');
    expect(prompts.requestFilename).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
    expect(fileWriter.write).not.toHaveBeenCalled();
  });

  it('cancels without requesting approval or creating a PDF outside a TTY session', async () => {
    review.isInteractive.mockReturnValue(false);

    await command.execute('Software engineer vacancy', 'en');

    expect(logger.log).toHaveBeenCalledWith('Generated CV cancelled: interactive approval is required.');
    expect(aiProvider.generateCV).not.toHaveBeenCalled();
    expect(review.review).not.toHaveBeenCalled();
    expect(prompts.requestFilename).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
    expect(fileWriter.write).not.toHaveBeenCalled();
  });
});
