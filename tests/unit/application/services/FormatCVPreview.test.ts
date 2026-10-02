import { describe, expect, it } from 'vitest';
import { formatCVPreview } from '../../../../src/application/services/FormatCVPreview.ts';
import type { CVData } from '../../../../src/domain/entities/CVData.ts';

describe('formatCVPreview', () => {
  it('renders every PDF-backed CV field as readable deterministic text', () => {
    const cvData: CVData = {
      name: 'Ada Lovelace',
      contact: {
        email: 'ada@example.com',
        phone: '+44 20 0000 0000',
        location: 'London, UK',
        github: 'github.com/ada',
        linkedin: 'linkedin.com/in/ada',
      },
      summary: 'Mathematician and software pioneer.',
      experience: [{
        title: 'Analyst',
        company: 'Analytical Engines',
        start_date: '1842',
        end_date: '1843',
        description: 'Wrote the [first algorithm].',
      }],
      education: [{
        degree: 'Mathematics',
        institution: 'University of London',
        year: '1835',
        description: 'Private study',
      }],
      skills: [{ category: 'Languages', items: ['Mathematics', 'Algorithms'] }],
      languages: [{ language: 'English', level: 'Native' }],
      generated_at: '2024-02-01T00:00:00.000Z',
    };

    expect(formatCVPreview(cvData)).toBe([
      'Generated CV preview',
      '',
      'Ada Lovelace',
      'London, UK | +44 20 0000 0000',
      'ada@example.com | github.com/ada | linkedin.com/in/ada',
      '',
      'Profile',
      'Mathematician and software pioneer.',
      '',
      'Experience',
      'Analyst | 1842 – 1843',
      'Analytical Engines',
      'Wrote the [first algorithm].',
      '',
      'Education',
      'Mathematics | 1835',
      'University of London',
      '',
      'Skills',
      'Languages: Mathematics - Algorithms',
      '',
      'Languages',
      'English (Native)',
    ].join('\n'));
  });
});
