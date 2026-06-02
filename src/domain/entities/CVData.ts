export interface SkillCategory {
  category: string;
  items: string[];
}

export interface CVData {
  name: string;
  contact: {
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: {
    title: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    description?: string;
  }[];
  skills: SkillCategory[];
  languages: { language: string; level: string }[];
  generated_at: string;
}

export function createEmptyCVData(): CVData {
  return {
    name: '',
    contact: { email: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    generated_at: new Date().toISOString(),
  };
}