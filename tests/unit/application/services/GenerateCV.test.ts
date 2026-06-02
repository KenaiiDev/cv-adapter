import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';
import type { IAIProvider, Language } from '../../../../src/interfaces/IAIProvider.ts';
import type { Profile } from '../../../../src/domain/entities/Profile.ts';
import type { CVData } from '../../../../src/domain/entities/CVData.ts';
import { GenerateCV } from '../../../../src/application/services/GenerateCV.ts';

describe('GenerateCV', () => {
  let mockAIProvider: IAIProvider;
  let generateCV: GenerateCV;

  const mockProfile: Profile = {
    name: 'John Doe',
    contact: { email: 'john@example.com' },
    experience: [],
    education: [],
    skills: ['JavaScript'],
    languages: [],
    updated_at: '2024-01-01',
  };

  const mockCVData: CVData = {
    name: 'John Doe',
    contact: { email: 'john@example.com' },
    summary: 'Experienced developer',
    experience: [{
      title: 'Senior Developer',
      company: 'Tech Corp',
      start_date: '2020',
      end_date: 'Present',
      description: 'Led development',
    }],
    education: [],
    skills: ['JavaScript', 'TypeScript'],
    languages: [{ language: 'English', level: 'Fluent' }],
    generated_at: '2024-01-15T10:00:00.000Z',
  };

  beforeEach(() => {
    mockAIProvider = mock<IAIProvider>();
    mockAIProvider.getProviderName.mockReturnValue('groq');
    generateCV = new GenerateCV(mockAIProvider);
  });

  describe('execute', () => {
    it('should call AI provider with correct profile and vacancy', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      await generateCV.execute(mockProfile, 'Senior Developer at Tech Corp', 'en');

      expect(mockAIProvider.generateCV).toHaveBeenCalledWith(
        mockProfile,
        'Senior Developer at Tech Corp',
        'en'
      );
    });

    it('should return CVData from AI provider', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      const result = await generateCV.execute(mockProfile, ' vacancy ', 'es');

      expect(result).toEqual(mockCVData);
    });

    it('should use correct language parameter', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      await generateCV.execute(mockProfile, ' vacancy ', 'es');

      expect(mockAIProvider.generateCV).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'es'
      );
    });

    it('should handle Spanish language', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      await generateCV.execute(mockProfile, ' vacancy ', 'es');

      expect(mockAIProvider.generateCV).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'es'
      );
    });

    it('should handle English language', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      await generateCV.execute(mockProfile, ' vacancy ', 'en');

      expect(mockAIProvider.generateCV).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'en'
      );
    });

    it('should propagate errors from AI provider', async () => {
      mockAIProvider.generateCV.mockRejectedValue(new Error('API Error'));

      await expect(
        generateCV.execute(mockProfile, ' vacancy ', 'en')
      ).rejects.toThrow('API Error');
    });

    it('should return correct CVData structure', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      const result = await generateCV.execute(mockProfile, ' vacancy ', 'en');

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('contact');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('experience');
      expect(result).toHaveProperty('education');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('languages');
      expect(result).toHaveProperty('generated_at');
    });
  });

  describe('provider name', () => {
    it('should log the provider name being used', async () => {
      mockAIProvider.generateCV.mockResolvedValue(mockCVData);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await generateCV.execute(mockProfile, ' vacancy ', 'en');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('groq'));

      consoleSpy.mockRestore();
    });
  });
});