import { describe, it, expect } from 'vitest';
import { createEmptyProfile, type Profile, type Contact, type Experience, type Education } from '../../../src/domain/entities/Profile.ts';

describe('Profile', () => {
  describe('createEmptyProfile', () => {
    it('should return Profile with empty name', () => {
      const profile = createEmptyProfile();
      expect(profile.name).toBe('');
    });

    it('should return Profile with empty contact email', () => {
      const profile = createEmptyProfile();
      expect(profile.contact.email).toBe('');
    });

    it('should return Profile with empty optional contact fields', () => {
      const profile = createEmptyProfile();
      expect(profile.contact.phone).toBeUndefined();
      expect(profile.contact.location).toBeUndefined();
      expect(profile.contact.linkedin).toBeUndefined();
      expect(profile.contact.github).toBeUndefined();
    });

    it('should return Profile with empty summary', () => {
      const profile = createEmptyProfile();
      expect(profile.summary).toBe('');
    });

    it('should return Profile with empty experience array', () => {
      const profile = createEmptyProfile();
      expect(profile.experience).toEqual([]);
      expect(Array.isArray(profile.experience)).toBe(true);
    });

    it('should return Profile with empty education array', () => {
      const profile = createEmptyProfile();
      expect(profile.education).toEqual([]);
      expect(Array.isArray(profile.education)).toBe(true);
    });

    it('should return Profile with empty skills array', () => {
      const profile = createEmptyProfile();
      expect(profile.skills).toEqual([]);
      expect(Array.isArray(profile.skills)).toBe(true);
    });

    it('should return Profile with empty languages array', () => {
      const profile = createEmptyProfile();
      expect(profile.languages).toEqual([]);
      expect(Array.isArray(profile.languages)).toBe(true);
    });

    it('should return Profile with valid updated_at date string', () => {
      const profile = createEmptyProfile();
      expect(profile.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return same structure as Profile interface', () => {
      const profile = createEmptyProfile();
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('contact');
      expect(profile).toHaveProperty('summary');
      expect(profile).toHaveProperty('experience');
      expect(profile).toHaveProperty('education');
      expect(profile).toHaveProperty('skills');
      expect(profile).toHaveProperty('languages');
      expect(profile).toHaveProperty('updated_at');
    });
  });

  describe('Profile interface structure', () => {
    it('Contact should have email as required string', () => {
      const profile = createEmptyProfile();
      const contact: Contact = profile.contact;
      expect(typeof contact.email).toBe('string');
    });

    it('Experience should have required fields', () => {
      const exp: Experience = {
        title: 'Developer',
        company: 'Test Co',
        start_date: '2020',
        end_date: '2021',
        description: 'Built things',
      };
      expect(exp.title).toBe('Developer');
      expect(exp.company).toBe('Test Co');
      expect(exp.start_date).toBe('2020');
      expect(exp.end_date).toBe('2021');
      expect(exp.description).toBe('Built things');
    });

    it('Education should have required fields', () => {
      const edu: Education = {
        degree: 'CS Degree',
        institution: 'Test University',
        year: '2020',
      };
      expect(edu.degree).toBe('CS Degree');
      expect(edu.institution).toBe('Test University');
      expect(edu.year).toBe('2020');
    });

    it('Profile should accept experience and education items', () => {
      const profile: Profile = {
        name: 'Test User',
        contact: { email: 'test@example.com' },
        experience: [{
          title: 'Developer',
          company: 'Test Co',
          start_date: '2020',
          end_date: '2021',
          description: 'Built things',
        }],
        education: [{
          degree: 'CS Degree',
          institution: 'Test University',
          year: '2020',
        }],
        skills: ['JavaScript', 'TypeScript'],
        languages: [{ language: 'English', level: 'Fluent' }],
        updated_at: '2024-01-01',
      };

      expect(profile.experience.length).toBe(1);
      expect(profile.education.length).toBe(1);
      expect(profile.skills.length).toBe(2);
      expect(profile.languages.length).toBe(1);
    });
  });
});