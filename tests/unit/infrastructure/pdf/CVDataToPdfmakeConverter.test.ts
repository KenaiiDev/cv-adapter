import { describe, it, expect, beforeEach } from 'vitest';
import { CVDataToPdfmakeConverter } from '../../../../src/infrastructure/pdf/CVDataToPdfmakeConverter.ts';
import { createMockCVData } from '../../../helpers/mockData.ts';

describe('CVDataToPdfmakeConverter', () => {
  let converter: CVDataToPdfmakeConverter;

  beforeEach(() => {
    converter = new CVDataToPdfmakeConverter();
  });

  describe('getLabels', () => {
    it('should return Spanish labels in uppercase when language is es', () => {
      const labels = (converter as any).getLabels('es');
      expect(labels.profile).toBe('PERFIL');
      expect(labels.experience).toBe('EXPERIENCIA PROFESIONAL');
      expect(labels.education).toBe('EDUCACIÓN');
      expect(labels.skills).toBe('HABILIDADES');
      expect(labels.languages).toBe('IDIOMAS');
    });

    it('should return English labels in uppercase when language is en', () => {
      const labels = (converter as any).getLabels('en');
      expect(labels.profile).toBe('PROFILE');
      expect(labels.experience).toBe('EXPERIENCE');
      expect(labels.education).toBe('EDUCATION');
      expect(labels.skills).toBe('SKILLS');
      expect(labels.languages).toBe('LANGUAGES');
    });
  });

  describe('toDocDefinition', () => {
    it('should create docDefinition with uppercase name centered', () => {
      const cvData = createMockCVData({ name: 'Juan Pérez' });
      const docDef = converter.toDocDefinition(cvData, 'es');

      expect(docDef.content[0].text).toBe('JUAN PÉREZ');
      expect(docDef.content[0].style).toBe('name');
      expect(docDef.content[0].alignment).toBe('center');
    });

    it('should format contact on separate lines (location/phone first, then links)', () => {
      const cvData = createMockCVData();
      const docDef = converter.toDocDefinition(cvData, 'en');

      const contactLine = docDef.content.find((item: any) => 
        item.text && item.text.includes('test@example.com')
      );
      expect(contactLine).toBeDefined();
      expect(contactLine.text).toContain('•');
    });

    it('should include profile section with uppercase Spanish labels', () => {
      const cvData = createMockCVData({ summary: 'Test summary' });
      const docDef = converter.toDocDefinition(cvData, 'es');

      const profileIndex = docDef.content.findIndex(
        (item: any) => item.text === 'PERFIL' && item.style === 'sectionTitle'
      );
      expect(profileIndex).not.toBe(-1);
    });

    it('should include experience section', () => {
      const cvData = createMockCVData({
        experience: [{
          title: 'Developer',
          company: 'Tech Co',
          start_date: '2020',
          end_date: 'Present',
          description: 'Built things',
        }],
      });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const expIndex = docDef.content.findIndex(
        (item: any) => item.text === 'EXPERIENCE' && item.style === 'sectionTitle'
      );
      expect(expIndex).not.toBe(-1);
    });

    it('should not include experience section when empty', () => {
      const cvData = createMockCVData({ experience: [] });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const hasExpTitle = docDef.content.some(
        (item: any) => item.text === 'EXPERIENCE' && item.style === 'sectionTitle'
      );
      expect(hasExpTitle).toBe(false);
    });

    it('should include education section', () => {
      const cvData = createMockCVData({
        education: [{
          degree: 'BS Computer Science',
          institution: 'MIT',
          year: '2020',
        }],
      });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const eduIndex = docDef.content.findIndex(
        (item: any) => item.text === 'EDUCATION' && item.style === 'sectionTitle'
      );
      expect(eduIndex).not.toBe(-1);
    });

    it('should include skills section', () => {
      const cvData = createMockCVData({
        skills: [{ category: 'Languages', items: ['TypeScript', 'React'] }],
      });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const skillsIndex = docDef.content.findIndex(
        (item: any) => item.text === 'SKILLS' && item.style === 'sectionTitle'
      );
      expect(skillsIndex).not.toBe(-1);
    });

    it('should include languages section', () => {
      const cvData = createMockCVData({
        languages: [
          { language: 'Spanish', level: 'Native' },
          { language: 'English', level: 'B2' },
        ],
      });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const langIndex = docDef.content.findIndex(
        (item: any) => item.text === 'LANGUAGES' && item.style === 'sectionTitle'
      );
      expect(langIndex).not.toBe(-1);
    });

    it('should set correct page margins', () => {
      const cvData = createMockCVData();
      const docDef = converter.toDocDefinition(cvData, 'en');

      expect(docDef.pageMargins).toEqual([25, 25, 25, 25]);
    });

    it('should set A4 page size', () => {
      const cvData = createMockCVData();
      const docDef = converter.toDocDefinition(cvData, 'en');

      expect(docDef.pageSize).toBe('A4');
    });

    it('should define all required styles', () => {
      const cvData = createMockCVData();
      const docDef = converter.toDocDefinition(cvData, 'en');

      expect(docDef.styles.name).toBeDefined();
      expect(docDef.styles.contactLine).toBeDefined();
      expect(docDef.styles.sectionTitle).toBeDefined();
      expect(docDef.styles.summaryText).toBeDefined();
      expect(docDef.styles.jobTitle).toBeDefined();
      expect(docDef.styles.jobDate).toBeDefined();
      expect(docDef.styles.company).toBeDefined();
      expect(docDef.styles.jobDescription).toBeDefined();
    });

    it('should use Helvetica as default font', () => {
      const cvData = createMockCVData();
      const docDef = converter.toDocDefinition(cvData, 'en');

      expect(docDef.defaultStyle.font).toBe('Helvetica');
    });

    it('should handle skills as categorized string', () => {
      const cvData = createMockCVData({
        skills: [
          { category: 'Languages', items: ['JavaScript', 'TypeScript'] },
          { category: 'Frameworks', items: ['React', 'Node.js'] },
        ],
      });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const skillsSection = docDef.content.find(
        (item: any) => item.style === 'skillItem'
      );
      expect(skillsSection).toBeDefined();
    });

    it('should parse [SkillName] pattern for bold highlighting', () => {
      const cvData = createMockCVData({
        experience: [{
          title: 'Developer',
          company: 'Tech Co',
          start_date: '2020',
          end_date: 'Present',
          description: 'Worked with [React] and [Node.js]',
        }],
      });
      const docDef = converter.toDocDefinition(cvData, 'en');

      const descItem = docDef.content.find((item: any) => 
        Array.isArray(item.text) && item.text.some((t: any) => t.bold === true)
      );
      expect(descItem).toBeDefined();
    });

    it('should handle missing optional fields', () => {
      const cvData = {
        name: 'Test User',
        contact: { email: 'test@test.com' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        languages: [],
        generated_at: '2024-01-15',
      };
      const docDef = converter.toDocDefinition(cvData as any, 'en');

      expect(docDef.content).toBeDefined();
      expect(docDef.content.length).toBeGreaterThan(0);
    });
  });
});