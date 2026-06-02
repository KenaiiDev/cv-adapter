import type { Profile } from '../../src/domain/entities/Profile.ts';
import type { CVData, SkillCategory } from '../../src/domain/entities/CVData.ts';

export function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: 'Test User',
    contact: {
      email: 'test@example.com',
      phone: '+54 11 5555 1234',
      location: 'Buenos Aires, Argentina',
      linkedin: 'https://linkedin.com/in/testuser',
      github: 'https://github.com/testuser',
    },
    summary: 'Experienced fullstack developer',
    experience: [
      {
        title: 'Fullstack Developer',
        company: 'Tech Corp',
        start_date: '2020',
        end_date: 'Present',
        description: 'Built and maintained web applications',
      },
      {
        title: 'Junior Developer',
        company: 'Startup XYZ',
        start_date: '2018',
        end_date: '2020',
        description: 'Developed frontend components',
      },
    ],
    education: [
      {
        degree: 'Computer Science',
        institution: 'University of Buenos Aires',
        year: '2018',
        description: 'Bachelor degree',
      },
    ],
    skills: [
      { category: 'Languages', items: ['TypeScript', 'Python'] },
      { category: 'Frameworks', items: ['React', 'Node.js'] },
    ],
    languages: [
      { language: 'Spanish', level: 'Native' },
      { language: 'English', level: 'B2' },
    ],
    updated_at: '2024-01-15',
    ...overrides,
  };
}

export function createMockCVData(overrides: Partial<CVData> = {}): CVData {
  return {
    name: 'Test User',
    contact: {
      email: 'test@example.com',
      phone: '+54 11 5555 1234',
      location: 'Buenos Aires, Argentina',
      linkedin: 'https://linkedin.com/in/testuser',
      github: 'https://github.com/testuser',
    },
    summary: 'Experienced fullstack developer with expertise in modern web technologies',
    experience: [
      {
        title: 'Fullstack Developer',
        company: 'Tech Corp',
        start_date: '2020',
        end_date: 'Present',
        description: 'Built and maintained web applications using React and Node.js',
      },
    ],
    education: [
      {
        degree: 'Computer Science',
        institution: 'University of Buenos Aires',
        year: '2018',
        description: 'Bachelor degree',
      },
    ],
    skills: [
      { category: 'Languages', items: ['TypeScript', 'Python'] },
      { category: 'Frameworks', items: ['React', 'Node.js'] },
      { category: 'Databases', items: ['PostgreSQL'] },
    ],
    languages: [
      { language: 'Spanish', level: 'Native' },
      { language: 'English', level: 'B2' },
    ],
    generated_at: '2024-01-15T10:30:00.000Z',
    ...overrides,
  };
}