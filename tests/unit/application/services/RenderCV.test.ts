import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IRenderer } from '../../../../src/interfaces/IRenderer.ts';
import type { CVData } from '../../../../src/domain/entities/CVData.ts';
import { RenderCV } from '../../../../src/application/services/RenderCV.ts';

describe('RenderCV', () => {
  let mockRenderer: IRenderer;
  let renderCV: RenderCV;

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
    education: [{
      degree: 'CS Degree',
      institution: 'University',
      year: '2019',
    }],
    skills: ['JavaScript', 'TypeScript'],
    languages: [{ language: 'English', level: 'Fluent' }],
    generated_at: '2024-01-15T10:00:00.000Z',
  };

  const expectedHTML = '<html><body>John Doe - CV</body></html>';

  beforeEach(() => {
    mockRenderer = mock<IRenderer>();
    renderCV = new RenderCV(mockRenderer);
  });

  describe('toHTML', () => {
    it('should call renderer.toHTML with CVData', async () => {
      mockRenderer.toHTML.mockResolvedValue(expectedHTML);

      await renderCV.toHTML(mockCVData);

      expect(mockRenderer.toHTML).toHaveBeenCalledWith(mockCVData);
    });

    it('should return HTML string from renderer', async () => {
      mockRenderer.toHTML.mockResolvedValue(expectedHTML);

      const result = await renderCV.toHTML(mockCVData);

      expect(result).toBe(expectedHTML);
    });

    it('should pass correct CVData structure to renderer', async () => {
      mockRenderer.toHTML.mockResolvedValue(expectedHTML);

      await renderCV.toHTML(mockCVData);

      expect(mockRenderer.toHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          contact: { email: 'john@example.com' },
        })
      );
    });

    it('should handle empty CVData', async () => {
      const emptyCV: CVData = {
        name: '',
        contact: { email: '' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        languages: [],
        generated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRenderer.toHTML.mockResolvedValue('<html></html>');

      const result = await renderCV.toHTML(emptyCV);

      expect(result).toBe('<html></html>');
    });

    it('should propagate errors from renderer', async () => {
      mockRenderer.toHTML.mockRejectedValue(new Error('Template not found'));

      await expect(renderCV.toHTML(mockCVData)).rejects.toThrow('Template not found');
    });

    it('should return non-empty HTML for populated CVData', async () => {
      const populatedCV: CVData = {
        ...mockCVData,
        experience: [{
          title: 'Developer',
          company: 'Tech Co',
          start_date: '2020',
          end_date: '2021',
          description: 'Built things',
        }],
        skills: ['JavaScript', 'TypeScript', 'React'],
      };

      mockRenderer.toHTML.mockResolvedValue('<html><div>Developer at Tech Co</div></html>');

      const result = await renderCV.toHTML(populatedCV);

      expect(result).toContain('Developer');
      expect(result).toContain('Tech Co');
    });
  });
});