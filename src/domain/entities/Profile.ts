export interface Contact {
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

export interface Experience {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

export interface Profile {
  name: string;
  contact: Contact;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  languages: { language: string; level: string }[];
  updated_at: string;
}

export function createEmptyProfile(): Profile {
  return {
    name: '',
    contact: {
      email: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    updated_at: new Date().toISOString().split('T')[0],
  };
}