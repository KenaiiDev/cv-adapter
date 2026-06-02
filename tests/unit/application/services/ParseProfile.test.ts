import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';
import type { IParser } from '../../../../src/interfaces/IParser.ts';
import type { IProfileRepository } from '../../../../src/interfaces/IProfileRepository.ts';
import type { Profile } from '../../../../src/domain/entities/Profile.ts';
import { ParseProfile } from '../../../../src/application/services/ParseProfile.ts';
import * as fs from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('ParseProfile', () => {
  let mockParser: IParser;
  let mockRepo: IProfileRepository;
  let parseProfile: ParseProfile;

  const mockProfile: Profile = {
    name: 'John Doe',
    contact: { email: 'john@example.com' },
    summary: 'Experienced developer',
    experience: [{
      title: 'Developer',
      company: 'Tech Co',
      start_date: '2020',
      end_date: '2021',
      description: 'Built web apps',
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
    mockParser = mock<IParser>();
    mockRepo = mock<IProfileRepository>();
    parseProfile = new ParseProfile(mockParser, mockRepo);
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  describe('fromPDF', () => {
    it('should throw error if file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(parseProfile.fromPDF('/nonexistent.pdf')).rejects.toThrow();
    });

    it('should call parser.parse with correct file path', async () => {
      mockParser.parse.mockResolvedValue('John Doe\nemail@example.com');
      mockParser.toProfile.mockReturnValue(mockProfile);
      mockRepo.save.mockResolvedValue();

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.parse).toHaveBeenCalledWith('/path/to/cv.pdf');
    });

    it('should call repository.save with parsed profile', async () => {
      mockParser.parse.mockResolvedValue('John Doe\njohn@example.com');
      mockParser.toProfile.mockReturnValue(mockProfile);
      mockRepo.save.mockResolvedValue();

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should return parsed profile', async () => {
      mockParser.parse.mockResolvedValue('John Doe\njohn@example.com');
      mockParser.toProfile.mockReturnValue(mockProfile);
      mockRepo.save.mockResolvedValue();

      const result = await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(result.name).toBe('John Doe');
    });
  });

  describe('extractName', () => {
    it('should extract name from first line if no email or http', async () => {
      mockParser.parse.mockResolvedValue('John Doe\nDeveloper\n2020 - 2021');
      mockParser.toProfile.mockReturnValue(mockProfile);
      mockRepo.save.mockResolvedValue();

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        'John Doe'
      );
    });

    it('should extract name from second line if first contains email', async () => {
      mockParser.parse.mockResolvedValue('john@example.com\nJohn Doe\nDeveloper');
      mockParser.toProfile.mockReturnValue(mockProfile);
      mockRepo.save.mockResolvedValue();

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        'John Doe'
      );
    });

    it('should extract name from second line if first contains http', async () => {
      mockParser.parse.mockResolvedValue('https://linkedin.com/in/john\nJohn Doe\nDeveloper');
      mockParser.toProfile.mockReturnValue(mockProfile);
      mockRepo.save.mockResolvedValue();

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        'John Doe'
      );
    });

    it('should return Unknown if text is empty', async () => {
      mockParser.parse.mockResolvedValue('');
      mockParser.toProfile.mockReturnValue({ ...mockProfile, name: 'Unknown' });
      mockRepo.save.mockResolvedValue();

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith('', 'Unknown');
    });
  });
});