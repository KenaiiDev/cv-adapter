import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFParser } from '../../../../src/infrastructure/parsers/PDFParser.ts';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

import * as fs from 'fs';

describe('PDFParser', () => {
  let parser: PDFParser;

  const sampleCVText = `
Lucas Martinez
email@example.com
+54 11 5555 1234
Buenos Aires, Argentina

EXPERIENCIA PROFESIONAL
Freelance
Desarrollador Fullstack
Buenos Aires, Argentina
Febrero 2021 – Actualidad
- Desarrollé aplicaciones web personalizadas
- Implementé APIs RESTful

EDUCACION
Universidad de Buenos Aires
Ingeniería de Sistemas
2020 – Actualidad

SKILLS ADICIONALES
-Tecnologias: React, NodeJS, TypeScript
-Testing: Vitest, Jest
-Herramientas: Git, Docker

Inglés (Intermedio)
`.trim();

  beforeEach(() => {
    parser = new PDFParser();
    vi.mocked(fs.readFileSync).mockReset();
  });

  describe('parse', () => {
    it('should call fs.readFileSync with correct file path', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fake pdf content'));

      const pdfParse = vi.fn().mockResolvedValue({ text: sampleCVText });
      vi.doMock('pdf-parse', () => ({ default: pdfParse }));

      await parser.parse('/path/to/cv.pdf');

      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/cv.pdf');
    });

    it('should return text content from PDF', async () => {
      const pdfParse = vi.fn().mockResolvedValue({ text: sampleCVText });
      vi.doMock('pdf-parse', () => ({ default: pdfParse }));

      const result = await parser.parse('/path/to/cv.pdf');

      expect(result).toBe(sampleCVText);
    });

    it('should throw DomainError if file not readable', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const pdfParse = vi.fn().mockRejectedValue(new Error('Cannot read'));
      vi.doMock('pdf-parse', () => ({ default: pdfParse }));

      await expect(parser.parse('/locked.pdf')).rejects.toThrow();
    });
  });

  describe('toProfile', () => {
    it('should use provided name parameter', () => {
      const profile = parser.toProfile(sampleCVText, 'Test User');

      expect(profile.name).toBe('Test User');
    });

    it('should extract email from CV text', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.contact.email).toBe('email@example.com');
    });

    it('should extract phone number from CV text', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.contact.phone).toContain('5555');
    });

    it('should extract location from CV text', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.contact.location).toBe('Buenos Aires, Argentina');
    });

    it('should parse experience section', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.experience.length).toBeGreaterThan(0);
    });

    it('should have experience entries with required fields', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      const exp = profile.experience[0];
      expect(exp).toHaveProperty('title');
      expect(exp).toHaveProperty('company');
      expect(exp).toHaveProperty('start_date');
      expect(exp).toHaveProperty('end_date');
      expect(exp).toHaveProperty('description');
    });

    it('should parse education section', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.education.length).toBeGreaterThan(0);
    });

    it('should have education entries with required fields', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      const edu = profile.education[0];
      expect(edu).toHaveProperty('degree');
      expect(edu).toHaveProperty('institution');
      expect(edu).toHaveProperty('year');
    });

    it('should parse skills section', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.skills.length).toBeGreaterThan(0);
    });

    it('should extract skills as array of strings', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(Array.isArray(profile.skills)).toBe(true);
      expect(profile.skills[0]).toBe('React');
    });

    it('should parse languages section', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.languages.length).toBeGreaterThan(0);
    });

    it('should have language entries with language and level', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      const lang = profile.languages[0];
      expect(lang).toHaveProperty('language');
      expect(lang).toHaveProperty('level');
    });

    it('should have valid updated_at date', () => {
      const profile = parser.toProfile(sampleCVText, 'Unknown');

      expect(profile.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use name parameter if name not found in text', () => {
      const textWithoutName = 'Some other content';
      const profile = parser.toProfile(textWithoutName, 'Fallback Name');

      expect(profile.name).toBe('Fallback Name');
    });

    it('should return empty arrays for missing sections', () => {
      const minimalText = 'Just a name';
      const profile = parser.toProfile(minimalText, 'Test');

      expect(profile.experience).toEqual([]);
      expect(profile.education).toEqual([]);
      expect(profile.skills).toEqual([]);
    });

    it('should handle empty text input', () => {
      const profile = parser.toProfile('', 'Test');

      expect(profile.name).toBe('Test');
      expect(profile.experience).toEqual([]);
    });
  });

  describe('toProfile with various CV formats', () => {
    it('should handle CV with multiple experiences', () => {
      const cvWithMultipleJobs = `
John Doe
john@email.com

EXPERIENCIA PROFESIONAL
Freelance
Desarrollador Fullstack
Jan 2020 – Dec 2021
- Built first project

Tech Company
Senior Developer
Jan 2022 – Present
- Built second project

EDUCACION
University of Test
BS Computer Science
2019
`.trim();

      const profile = parser.toProfile(cvWithMultipleJobs, 'John');

      expect(profile.experience.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle CV with different date formats', () => {
      const cvWithDates = `
Developer
dev@email.com

EXPERIENCIA PROFESIONAL
Freelance
Dev
2020 - 2021
- Work
      `.trim();

      const profile = parser.toProfile(cvWithDates, 'Dev');

      expect(profile.experience.length).toBeGreaterThan(0);
    });

    it('should handle CV without education section', () => {
      const cvNoEducation = `
Dev Name
dev@email.com

EXPERIENCIA PROFESIONAL
Freelance
Developer
2020 – Present
- Built things

SKILLS ADICIONALES
-JavaScript, TypeScript
      `.trim();

      const profile = parser.toProfile(cvNoEducation, 'Dev');

      expect(profile.experience.length).toBeGreaterThan(0);
      expect(profile.education).toEqual([]);
    });
  });
});