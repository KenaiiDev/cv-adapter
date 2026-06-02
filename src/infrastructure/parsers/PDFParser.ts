import * as fs from 'fs';
import type { Profile, Experience, Education } from '../../domain/entities/Profile.js';
import type { IParser } from '../../interfaces/IParser.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export class PDFParser implements IParser {
  async parse(filePath: string): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new DomainError(
        'No se pudo leer el PDF',
        'PARSE_ERROR',
        'Verificá que el PDF tenga texto seleccionable (no es una imagen)'
      );
    }
  }

  toProfile(text: string, name: string): Profile {
    const profile: Profile = {
      name: name,
      contact: { email: '', phone: '', location: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      languages: [],
      updated_at: new Date().toISOString().split('T')[0],
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !profile.contact.email) {
        profile.contact.email = emailMatch[0];
      }

      const linkedinMatch = line.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
      if (linkedinMatch && !profile.contact.linkedin) {
        profile.contact.linkedin = 'https://' + linkedinMatch[0];
      }

      const githubMatch = line.match(/github\.com\/[a-zA-Z0-9-]+/i);
      if (githubMatch && !profile.contact.github) {
        profile.contact.github = 'https://' + githubMatch[0];
      }

      const phoneMatch = line.match(/\+54\s*9?\s*11?\s*[\d\s]{8,}/);
      if (phoneMatch && !profile.contact.phone) {
        profile.contact.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
      }

      if (!profile.contact.location && (line.includes('Buenos Aires') || line.includes('Argentina') || line.includes('Madrid') || line.includes('Barcelona') || line.includes('Mexico'))) {
        const locationMatch = line.match(/(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*)+(?:Argentina|España|México|Colombia|Chile|Brasil|Perú)/);
        if (locationMatch) {
          profile.contact.location = locationMatch[0];
        }
      }

      if (upper.startsWith('EXPERIENCIA PROFESIONAL')) {
        const expBlock = this.parseExperienceSection(lines, i + 1);
        profile.experience = expBlock;
      }

      if (upper.startsWith('EDUCACI')) {
        const eduBlock = this.parseEducationSection(lines, i + 1);
        profile.education = eduBlock;
      }

      if (upper.startsWith('SKILLS ADICIONALES') || upper.startsWith('TECNOLOG')) {
        const skillsBlock = this.parseSkillsSection(lines, i + 1);
        profile.skills = skillsBlock;
      }

      if (line.includes('Desarrollador Fullstack con experiencia')) {
        profile.summary = line + (lines[i + 1] || '');
      }

      if (upper.includes('INGL') || upper.includes('ENGLISH')) {
        const langMatch = line.match(/(?:Inglés|English)[^\w]*([A-Za-z0-9]+)?/);
        if (langMatch && !profile.languages.some(l => l.language === 'English')) {
          profile.languages.push({ language: 'English', level: langMatch[2] || 'Intermediate' });
        }
      }
    }

    profile.name = profile.name || name;
    return profile;
  }

  private parseExperienceSection(lines: string[], startIdx: number): Experience[] {
    const experiences: Experience[] = [];
    let current: Partial<Experience> | null = null;
    let descriptionBuffer = '';

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
                        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
                        'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const isMonthDateLine = (line: string): boolean => {
      const upper = line.toUpperCase();
      return monthNames.some(m => {
        const monthUpper = m.toUpperCase();
        return upper.startsWith(monthUpper + ' ') || upper.startsWith(m + ' ');
      }) && (line.includes(' - ') || line.includes(' – ') || line.includes('-'));
    };

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      if (upper.startsWith('EDUCACI') || upper.startsWith('SKILLS') || upper.startsWith('TECNOLOG')) {
        break;
      }

      if (line.startsWith('Freelance') || line.startsWith('Freelance')) {
        if (current?.title && current.title !== 'Freelance') {
          current.description = descriptionBuffer.trim();
          experiences.push(current as Experience);
        }
        if (!current) current = { title: '', company: '', start_date: '', end_date: '', description: '' };
        current.company = line;
        descriptionBuffer = '';
      } else if (line.startsWith('-')) {
        const desc = line.replace(/^-\s*/, '').trim();
        if (desc) descriptionBuffer += desc + ' ';
      } else if (isMonthDateLine(line)) {
        if (current && (current.title || current.company) && descriptionBuffer.trim()) {
          current.description = descriptionBuffer.trim();
          experiences.push(current as Experience);
          current = null;
          descriptionBuffer = '';
        }
        const parts = line.split(/\s*[-–]\s*/);
        if (parts.length >= 1 && parts[0].trim()) {
          if (!current || (!current.title && !current.company)) {
            current = { title: '', company: '', start_date: '', end_date: '', description: '' };
          }
          const dateParts = parts[0].trim().split(/\s+/);
          if (dateParts.length >= 2) {
            if (monthNames.some(m => m === dateParts[0] || m.toUpperCase() === dateParts[0].toUpperCase())) {
              current.start_date = parts[0].trim();
            } else if (dateParts[0].match(/^\d{4}$/)) {
              current.start_date = parts[0].trim();
            }
          }
          if (parts[1]) current.end_date = parts[1].trim();
        }
      } else if (line.startsWith('Desarrollador') || line.startsWith('Developer') || line.startsWith('Ingenier') || line.startsWith('Senior')) {
        if (!current) current = { title: '', company: '', start_date: '', end_date: '', description: '' };
        if (!current.title) current.title = line;
      } else if (line.length > 3 && !line.startsWith('http') && !line.includes('@') && !line.match(/^\+54/) && !line.match(/^\d{4}/)) {
        if (!current) {
          current = { title: '', company: '', start_date: '', end_date: '', description: '' };
        }
        if (!current.title && line.length < 50) {
          current.title = line;
        }
      }
    }

    if (current?.title || current?.company) {
      current.description = descriptionBuffer.trim();
      experiences.push(current as Experience);
    }

    return experiences;
  }

  private parseEducationSection(lines: string[], startIdx: number): Education[] {
    const education: Education[] = [];
    let current: Partial<Education> | null = null;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      if (upper.startsWith('SKILLS') || upper.startsWith('TECNOLOG')) {
        break;
      }

      if (line.match(/^\d{4}\s*[-–]/)) {
        if (current?.degree) {
          education.push(current as Education);
        }
        current = { degree: '', institution: '', year: '' };
        const parts = line.split(/[-–]/);
        if (parts[0]) current.year = parts[0].trim();
      } else if (line.includes('Universidad') || line.includes('Institute') || line.includes('Instituto') || line.includes('Global Learning') || line.includes('EET') || line.includes('University')) {
        if (!current) current = { degree: '', institution: '', year: '' };
        if (!current.institution && (line.includes('Universidad') || line.includes('Global Learning') || line.includes('EET') || line.includes('University'))) {
          current.institution = line;
        } else if (!current.degree) {
          current.degree = line;
        }
      } else if (line.match(/\d{4}/) && !current?.year) {
        const yearMatch = line.match(/\d{4}/);
        if (yearMatch) {
          if (!current) current = { degree: '', institution: '', year: '' };
          current.year = yearMatch[0];
        }
      } else if (line.includes('Técnico') || line.includes('Ingeniería') || line.includes('Desarrollador') || line.includes('BS') || line.includes('MS') || line.includes('Degree')) {
        if (!current) current = { degree: '', institution: '', year: '' };
        if (!current.degree) current.degree = line;
      }
    }

    if (current?.degree) {
      education.push(current as Education);
    }

    return education;
  }

  private parseSkillsSection(lines: string[], startIdx: number): string[] {
    const skills: string[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('-')) {
        const cleaned = line.replace(/^-\s*/, '').replace(/^Tecnologias:\s*/i, '').replace(/^Testing:\s*/i, '').replace(/^Herramientas.*:\s*/i, '');
        const parts = cleaned.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 1);
        skills.push(...parts);
      }

      if (line.includes('Inglés') || line.includes('English')) {
        const langMatch = line.match(/(Inglés|English)[^\w]*([A-Za-z0-9]+)?/);
        if (langMatch && !skills.includes('English')) {
          skills.push('English');
        }
      }
    }

    return [...new Set(skills)];
  }
}