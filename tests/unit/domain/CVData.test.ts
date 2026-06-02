import { describe, it, expect } from 'vitest';
import { createEmptyCVData, type CVData } from '../../../src/domain/entities/CVData.ts';

describe('CVData', () => {
  describe('createEmptyCVData', () => {
    it('should return CVData with empty name', () => {
      const cvData = createEmptyCVData();
      expect(cvData.name).toBe('');
    });

    it('should return CVData with empty contact email', () => {
      const cvData = createEmptyCVData();
      expect(cvData.contact.email).toBe('');
    });

    it('should return CVData with empty summary', () => {
      const cvData = createEmptyCVData();
      expect(cvData.summary).toBe('');
    });

    it('should return CVData with empty experience array', () => {
      const cvData = createEmptyCVData();
      expect(cvData.experience).toEqual([]);
      expect(Array.isArray(cvData.experience)).toBe(true);
    });

    it('should return CVData with empty education array', () => {
      const cvData = createEmptyCVData();
      expect(cvData.education).toEqual([]);
      expect(Array.isArray(cvData.education)).toBe(true);
    });

    it('should return CVData with empty skills array', () => {
      const cvData = createEmptyCVData();
      expect(cvData.skills).toEqual([]);
      expect(Array.isArray(cvData.skills)).toBe(true);
    });

    it('should return CVData with empty languages array', () => {
      const cvData = createEmptyCVData();
      expect(cvData.languages).toEqual([]);
      expect(Array.isArray(cvData.languages)).toBe(true);
    });

    it('should return CVData with valid generated_at ISO string', () => {
      const cvData = createEmptyCVData();
      expect(cvData.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return same structure as CVData interface', () => {
      const cvData = createEmptyCVData();
      expect(cvData).toHaveProperty('name');
      expect(cvData).toHaveProperty('contact');
      expect(cvData).toHaveProperty('summary');
      expect(cvData).toHaveProperty('experience');
      expect(cvData).toHaveProperty('education');
      expect(cvData).toHaveProperty('skills');
      expect(cvData).toHaveProperty('languages');
      expect(cvData).toHaveProperty('generated_at');
    });
  });

  describe('CVData interface structure', () => {
    it('should accept valid CVData with all fields', () => {
      const cvData: CVData = {
        name: 'John Doe',
        contact: {
          email: 'john@example.com',
          phone: '+54 11 1234 5678',
          location: 'Buenos Aires, Argentina',
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe',
        },
        summary: 'Experienced developer',
        experience: [{
          title: 'Senior Developer',
          company: 'Tech Corp',
          start_date: '2020',
          end_date: 'Present',
          description: 'Led development team',
        }],
        education: [{
          degree: 'Computer Science',
          institution: 'University of Buenos Aires',
          year: '2018',
        }],
        skills: ['TypeScript', 'React', 'Node.js'],
        languages: [{ language: 'English', level: 'C1' }],
        generated_at: '2024-01-15T10:30:00.000Z',
      };

      expect(cvData.name).toBe('John Doe');
      expect(cvData.contact.email).toBe('john@example.com');
      expect(cvData.experience.length).toBe(1);
      expect(cvData.education.length).toBe(1);
      expect(cvData.skills.length).toBe(3);
      expect(cvData.languages.length).toBe(1);
    });

    it('should have generated_at in ISO format', () => {
      const cvData = createEmptyCVData();
      const date = new Date(cvData.generated_at);
      expect(date.toISOString()).toBe(cvData.generated_at);
    });
  });
});