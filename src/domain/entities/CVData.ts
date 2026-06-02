import type { Contact, Experience, Education } from './Profile.js';

export interface CVData {
  name: string;
  contact: Contact;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
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