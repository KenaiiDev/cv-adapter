import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import type { IParser } from '../../../../src/interfaces/IParser.ts';
import type { Profile } from '../../../../src/domain/entities/Profile.ts';
import { ParseProfile } from '../../../../src/application/services/ParseProfile.ts';
import * as fs from 'fs';
import { DomainError } from '../../../../src/domain/errors/DomainError.ts';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('ParseProfile', () => {
  let mockParser: MockProxy<IParser>;
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
    skills: [{ category: 'Languages', items: ['JavaScript', 'TypeScript'] }],
    languages: [{ language: 'English', level: 'Fluent' }],
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    mockParser = mock<IParser>();
    parseProfile = new ParseProfile(mockParser);
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

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.parse).toHaveBeenCalledWith('/path/to/cv.pdf');
    });

    it('returns a candidate without persisting it', async () => {
      mockParser.parse.mockResolvedValue('John Doe\njohn@example.com');
      mockParser.toProfile.mockReturnValue(mockProfile);

      const result = await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(result).toEqual(mockProfile);
    });

    it('should return parsed profile', async () => {
      mockParser.parse.mockResolvedValue('John Doe\njohn@example.com');
      mockParser.toProfile.mockReturnValue(mockProfile);

      const result = await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(result.name).toBe('John Doe');
    });

    it('rejects a structurally invalid parser candidate with a domain error', async () => {
      mockParser.parse.mockResolvedValue('John Doe');
      mockParser.toProfile.mockReturnValue({ name: 'John Doe' } as Profile);

      await expect(parseProfile.fromPDF('/path/to/cv.pdf')).rejects.toMatchObject({
        code: 'INVALID_PROFILE',
      } satisfies Partial<DomainError>);
    });

    it('does not write directly to stdout', async () => {
      mockParser.parse.mockResolvedValue('John Doe');
      mockParser.toProfile.mockReturnValue(mockProfile);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('extractName', () => {
    it('should extract name from first line if no email or http', async () => {
      mockParser.parse.mockResolvedValue('John Doe\nDeveloper\n2020 - 2021');
      mockParser.toProfile.mockReturnValue(mockProfile);

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        'John Doe'
      );
    });

    it('should extract name from second line if first contains email', async () => {
      mockParser.parse.mockResolvedValue('john@example.com\nJohn Doe\nDeveloper');
      mockParser.toProfile.mockReturnValue(mockProfile);

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        'John Doe'
      );
    });

    it('should extract name from second line if first contains http', async () => {
      mockParser.parse.mockResolvedValue('https://linkedin.com/in/john\nJohn Doe\nDeveloper');
      mockParser.toProfile.mockReturnValue(mockProfile);

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        'John Doe'
      );
    });

    it('should return Unknown if text is empty', async () => {
      mockParser.parse.mockResolvedValue('');
      mockParser.toProfile.mockReturnValue({ ...mockProfile, name: 'Unknown' });

      await parseProfile.fromPDF('/path/to/cv.pdf');

      expect(mockParser.toProfile).toHaveBeenCalledWith('', 'Unknown');
    });
  });
});
