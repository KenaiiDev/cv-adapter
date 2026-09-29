import { z } from 'zod';
import { DomainError } from '../errors/DomainError.js';
import type { SkillCategory } from './CVData.js';

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

export type { SkillCategory } from './CVData.js';

export interface Profile {
  name: string;
  contact: Contact;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: SkillCategory[];
  languages: { language: string; level: string }[];
  updated_at: string;
}

const profileSchema = z.object({
  name: z.string(),
  contact: z.object({
    email: z.string(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    description: z.string(),
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string(),
    description: z.string().optional(),
  })),
  skills: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })),
  languages: z.array(z.object({
    language: z.string(),
    level: z.string(),
  })),
  updated_at: z.string(),
});

export function validateProfile(candidate: unknown): Profile {
  const result = profileSchema.safeParse(candidate);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.length > 0 ? issue.path.join('.') : 'profile';
    throw new DomainError(
      `Invalid profile at ${path}: ${issue.message}`,
      'INVALID_PROFILE',
      'Import or restore a profile with the expected structure',
    );
  }

  return result.data;
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
