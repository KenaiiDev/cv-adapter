import * as fs from 'fs';
import type { Profile, Experience, Education, SkillCategory } from '../../domain/entities/Profile.js';
import type { IParser } from '../../interfaces/IParser.js';
import { DomainError } from '../../domain/errors/DomainError.js';

type Locale = 'es' | 'en';

export class PDFParser implements IParser {
  private locale: Locale = 'es';

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
    const isEnglish = text.toLowerCase().includes('professional profile') ||
                      text.toLowerCase().includes('experience') ||
                      text.toLowerCase().includes('education') ||
                      text.toLowerCase().includes('skills');

    this.locale = isEnglish ? 'en' : 'es';

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

    const sections: Array<{ type: string; startIdx: number; endIdx: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const sectionData = this.parseSectionHeader(lines[i]);
      if (sectionData) {
        const endIdx = this.findSectionEnd(lines, i + 1, sectionData.type);
        sections.push({ type: sectionData.type, startIdx: i + 1, endIdx });
      }
    }

    for (const section of sections) {
      switch (section.type) {
        case 'EXPERIENCE':
          profile.experience = this.parseExperienceSection(lines, section.startIdx, section.endIdx);
          break;
        case 'EDUCATION':
          profile.education = this.parseEducationSection(lines, section.startIdx, section.endIdx);
          break;
        case 'SKILLS':
          const { skills, languages } = this.parseSkillsSection(lines, section.startIdx, section.endIdx);
          profile.skills = skills;
          if (languages.length > 0) {
            profile.languages = this.mergeLanguages(profile.languages, languages);
          }
          break;
        case 'SUMMARY':
          this.parseSummarySection(lines, section.startIdx, section.endIdx, profile);
          break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      this.parseContactInfo(lines[i], profile);
      this.parseSummary(lines, i, profile);
    }

    profile.name = profile.name || name;
    return profile;
  }

  private parseSectionHeader(line: string): { type: string; endIdx: number } | null {
    const upper = line.toUpperCase();
    const trimmed = line.trim();

    if (trimmed.length > 50) return null;

    if (/^EXPERIENC(I?A)?\s*(PROFESIONAL|PROFESSIONAL)?$/.test(upper) || /^WORK\s*EXPERIENCE$/.test(upper)) {
      return { type: 'EXPERIENCE', endIdx: 0 };
    }
    if (/^EDUCACI[OÓ]N$/.test(upper) || /^ACADEMI[CS]$/.test(upper)) {
      return { type: 'EDUCATION', endIdx: 0 };
    }
    if (/^SKILLS?\s*(T[ÉE]CNICOS?|TÉCNICAS?|TECHNICAL)?$/.test(upper) || upper.includes('SKILLS')) {
      return { type: 'SKILLS', endIdx: 0 };
    }
    if (/^PERFIL\s*PROFESIONAL$/.test(upper) || /^SUMMARY$/.test(upper)) {
      return { type: 'SUMMARY', endIdx: 0 };
    }

    return null;
  }

  private parseSection(section: string, lines: string[], startIdx: number, profile: Profile): number {
    const endIdx = this.findSectionEnd(lines, startIdx + 1, section);

    switch (section) {
      case 'EXPERIENCE':
        profile.experience = this.parseExperienceSection(lines, startIdx + 1, endIdx);
        break;
      case 'EDUCATION':
        profile.education = this.parseEducationSection(lines, startIdx + 1, endIdx);
        break;
      case 'SKILLS':
        const { skills, languages } = this.parseSkillsSection(lines, startIdx + 1, endIdx);
        profile.skills = skills;
        if (languages.length > 0) {
          profile.languages = this.mergeLanguages(profile.languages, languages);
        }
        break;
      case 'SUMMARY':
        this.parseSummarySection(lines, startIdx + 1, endIdx, profile);
        break;
    }

    return endIdx;
  }

  private findSectionEnd(lines: string[], startIdx: number, currentSection: string): number {
    const sectionKeywords = ['EXPERIENC', 'EDUCACI', 'SKILLS', 'TECNOLOG', 'PERFIL', 'SUMMARY', 'LINKS', 'CONTACT'];

    for (let i = startIdx; i < lines.length; i++) {
      const upper = lines[i].toUpperCase();
      const trimmed = lines[i].trim();

      if (trimmed.length > 50) continue;

      for (const keyword of sectionKeywords) {
        if (upper.startsWith(keyword)) {
          return i - 1;
        }
      }

      if (trimmed === '1') {
        return i - 1;
      }
    }

    return lines.length;
  }

  private parseContactInfo(line: string, profile: Profile): void {
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

    if (!profile.contact.location) {
      const cities = ['Buenos Aires', 'Argentina', 'Madrid', 'Barcelona', 'Mexico', 'Colombia', 'Chile', 'Brasil', 'Peru', 'Lima', 'Montevideo', 'Santiago'];
      for (const city of cities) {
        if (line.includes(city)) {
          profile.contact.location = line.trim();
          break;
        }
      }
    }
  }

  private parseSummary(lines: string[], idx: number, profile: Profile): void {
    const line = lines[idx];
    const upper = line.toUpperCase();

    if (upper.includes('DESARROLLADOR') || upper.includes('DEVELOPER') || upper.includes('FULLSTACK')) {
      if (!profile.summary) {
        profile.summary = line;
        for (let j = idx + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.toUpperCase().startsWith('EXPERIENC') || nextLine.toUpperCase().startsWith('EDUCACI') || nextLine.toUpperCase().startsWith('SKILLS')) {
            break;
          }
          if (nextLine.length > 10 && !nextLine.startsWith('http') && !nextLine.includes('@')) {
            profile.summary += ' ' + nextLine;
          } else if (nextLine.length <= 10 && j < lines.length - 1) {
            profile.summary += ' ' + nextLine;
          }
        }
      }
    }
  }

  private parseSummarySection(lines: string[], startIdx: number, endIdx: number, profile: Profile): void {
    const summaryLines: string[] = [];

    for (let i = startIdx; i <= endIdx && i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      if (upper.startsWith('EXPERIENC') || upper.startsWith('EDUCACI') || upper.startsWith('SKILLS')) {
        break;
      }

      if (line.length > 20 && !line.startsWith('http') && !line.match(/^[A-Z]{3,}\s/)) {
        summaryLines.push(line);
      }
    }

    if (summaryLines.length > 0) {
      profile.summary = summaryLines.join(' ').replace(/\s+/g, ' ').trim();
    }
  }

  private parseExperienceSection(lines: string[], startIdx: number, endIdx: number): Experience[] {
    const experiences: Experience[] = [];

    const monthNamesEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const allMonths = [...monthNamesEs, ...monthNamesEn, ...monthNamesShort];

    const companyKeywordsEs = ['Freelance', 'MSA', 'M&M', 'Google', 'Microsoft', 'Amazon', 'Mercado', 'Globant', 'Tiendanube', 'Auth0'];
    const companyKeywordsEn = ['Freelance', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Spotify', 'Stripe'];

    const findDateInfo = (line: string): { dateStart: string; dateEnd: string; dateLineIdx: number; dateLineLen: number } | null => {
      const fullYearMatch = line.match(/^\s*(\d{4})\s*[-–]\s*(\d{4}|Actual|Now|Present)\s*$/i);
      if (fullYearMatch) {
        let endDate = fullYearMatch[2];
        if (/^(Actual|Now|Present)$/i.test(endDate)) {
          endDate = 'Actual';
        }
        return {
          dateStart: fullYearMatch[1],
          dateEnd: endDate,
          dateLineIdx: 0,
          dateLineLen: line.length
        };
      }

      let earliestMonthIndex = -1;
      let earliestMonth = '';
      let earliestAfterMonth = '';

      for (const month of allMonths) {
        const monthIndex = line.indexOf(month);
        if (monthIndex !== -1 && (earliestMonthIndex === -1 || monthIndex < earliestMonthIndex)) {
          earliestMonthIndex = monthIndex;
          earliestMonth = month;
          earliestAfterMonth = line.substring(monthIndex + month.length);
        }
      }

      if (earliestMonthIndex === -1) return null;

      const dateRangeMatch = earliestAfterMonth.match(/^\s*(\d{4})\s*[-–]\s*(.*)$/i);
      if (dateRangeMatch) {
        const startYear = dateRangeMatch[1];
        let endDate = dateRangeMatch[2].trim();

        if (/^(Actual|Now|Present)$/i.test(endDate)) {
          endDate = 'Actual';
        } else if (!endDate.match(/\d{4}/)) {
          endDate = 'Actual';
        }

        return {
          dateStart: `${earliestMonth} ${startYear}`,
          dateEnd: endDate,
          dateLineIdx: earliestMonthIndex,
          dateLineLen: earliestMonth.length + dateRangeMatch[0].length
        };
      }

      const yearOnlyMatch = earliestAfterMonth.match(/^\s*(\d{4})(?:\s|$)/i);
      if (yearOnlyMatch) {
        return {
          dateStart: `${earliestMonth} ${yearOnlyMatch[1]}`,
          dateEnd: 'Actual',
          dateLineIdx: earliestMonthIndex,
          dateLineLen: earliestMonth.length + yearOnlyMatch[0].length
        };
      }

      return null;
    };

    let currentExp: Partial<Experience> | null = null;
    let descriptionBuffer = '';

    for (let i = startIdx; i <= endIdx && i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine === '1') continue;

      const dateInfo = findDateInfo(trimmedLine);

      if (dateInfo) {
        if (currentExp?.title || currentExp?.company) {
          currentExp.description = descriptionBuffer.trim();
          if (currentExp.title || currentExp.company) {
            experiences.push(currentExp as Experience);
          }
        }

        descriptionBuffer = '';

        const beforeDate = trimmedLine.substring(0, dateInfo.dateLineIdx).trim();
        const afterDate = trimmedLine.substring(dateInfo.dateLineIdx + dateInfo.dateLineLen).trim();

        let company = '';
        let title = '';

        const isCompanyKeyword = [...companyKeywordsEs, ...companyKeywordsEn].some(k => beforeDate.includes(k));
        if (isCompanyKeyword || beforeDate.includes('Freelance')) {
          company = beforeDate.replace(/[-–]\s*$/, '').trim();
        } else if (beforeDate.length > 0 && beforeDate.length < 40) {
          company = beforeDate;
        }

        if (afterDate.length > 0 && afterDate.length < 60) {
          title = afterDate;
        }

        currentExp = {
          title: title,
          company: company || 'Freelance',
          start_date: dateInfo.dateStart,
          end_date: dateInfo.dateEnd,
          description: '',
        };
        continue;
      }

      if (trimmedLine.startsWith('-')) {
        const desc = trimmedLine.replace(/^-\s*/, '').replace(/-\s*$/, '').trim();
        if (desc) {
          descriptionBuffer += desc + ' ';
        }
        continue;
      }

      if (currentExp && !currentExp.title && trimmedLine.length < 60 && !trimmedLine.includes('@') && !trimmedLine.match(/^\+54/)) {
        currentExp.title = trimmedLine;
        continue;
      }

      if (currentExp && currentExp.title && trimmedLine.length > 20) {
        descriptionBuffer += trimmedLine + ' ';
      }
    }

    if (currentExp?.title || currentExp?.company) {
      currentExp.description = descriptionBuffer.trim();
      if (currentExp.title || currentExp.company) {
        experiences.push(currentExp as Experience);
      }
    }

    return experiences;
  }

  private parseEducationSection(lines: string[], startIdx: number, endIdx: number): Education[] {
    const education: Education[] = [];
    let current: Partial<Education> | null = null;

    const institutionKeywords = ['Universidad', 'University', 'Instituto', 'Global Learning', 'EET', 'School', 'Institute', 'Academy', 'College', 'Colegio'];
    const degreeKeywords = ['Ingeniería', 'Bachelor', 'Técnico', 'Master', 'Licenciatura', 'Degree', 'Desarrollador', 'Certificate', 'TSU', 'Diploma'];

    const isYearLine = (line: string): boolean => {
      return /^\d{4}\s*[-–]\s*\d{4}$/.test(line.trim()) || /^\d{4}\s*[-–]\s*(Actual|Now|Present)$/i.test(line.trim());
    };

    const hasYear = (line: string): boolean => {
      return /\d{4}\s*[-–]\s*\d{4}/.test(line) || /\d{4}\s*[-–]\s*(Actual|Now|Present)/i.test(line);
    };

    for (let i = startIdx; i <= endIdx && i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine === '1') continue;

      if (isYearLine(trimmedLine)) {
        const years = trimmedLine.split(/[-–]/).map(s => s.trim());
        if (current) {
          current.year = years[0];
          education.push(current as Education);
          current = null;
        }
        continue;
      }

      const lineHasInstitution = institutionKeywords.some(k => trimmedLine.includes(k));
      const lineHasDegree = degreeKeywords.some(k => trimmedLine.includes(k));
      const lineHasYear = hasYear(trimmedLine);

      if (lineHasInstitution && !lineHasYear) {
        if (current?.degree || current?.institution) {
          education.push(current as Education);
        }

        const cleanedInstitution = this.cleanEducationValue(trimmedLine);
        current = { degree: '', institution: cleanedInstitution, year: '' };
        continue;
      }

      if (lineHasYear) {
        const yearMatch = trimmedLine.match(/(\d{4})\s*[-–]\s*(Actual|Now|Present|\d{4})?/);
        if (yearMatch) {
          if (current?.institution && !current?.degree) {
            const beforeYear = trimmedLine.substring(0, yearMatch.index!).trim();
            current.degree = beforeYear || current.degree;
          }

          if (current) {
            current.year = yearMatch[1];
          } else {
            const beforeYear = trimmedLine.substring(0, yearMatch.index!).trim();
            current = {
              degree: beforeYear.includes('Ingeniería') || beforeYear.includes('Bachelor') ? beforeYear : '',
              institution: beforeYear.includes('Universidad') || beforeYear.includes('Institute') ? this.cleanEducationValue(beforeYear) : '',
              year: yearMatch[1]
            };
          }

          if (current.degree || current.institution) {
            education.push(current as Education);
            current = null;
          }
        }
        continue;
      }

      if (lineHasDegree && !current?.degree) {
        if (current?.institution) {
          current.degree = trimmedLine;
        } else {
          current = { degree: trimmedLine, institution: '', year: '' };
        }
        continue;
      }

      if (current?.institution && !current?.degree && trimmedLine.length < 80) {
        current.degree = trimmedLine;
      }
    }

    if (current?.degree || current?.institution) {
      education.push(current as Education);
    }

    return education;
  }

  private cleanEducationValue(value: string): string {
    let cleaned = value
      .replace(/Buenos Aires$/, '')
      .replace(/Argentina$/, '')
      .replace(/Madrid$/, '')
      .replace(/Barcelona$/, '')
      .replace(/México$/, '')
      .trim();

    cleaned = cleaned.replace(/[-,]\s*$/, '').trim();

    return cleaned;
  }

  private parseSkillsSection(lines: string[], startIdx: number, endIdx: number): { skills: SkillCategory[]; languages: Array<{ language: string; level: string }> } {
    const skillsMap: Map<string, string[]> = new Map();
    const languages: Array<{ language: string; level: string }> = [];

    const languageKeywordsEs = ['Inglés', 'Español', 'Portugués', 'Francés', 'Alemán', 'Italiano'];
    const languageKeywordsEn = ['English', 'Spanish', 'Portuguese', 'French', 'German', 'Italian'];

    for (let i = startIdx; i <= endIdx && i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine === '1') continue;

      if (trimmedLine.startsWith('Links') || trimmedLine.startsWith('CONTACT')) {
        break;
      }

      if (trimmedLine.includes(':') && !trimmedLine.startsWith('-')) {
        const colonIndex = trimmedLine.indexOf(':');
        const category = trimmedLine.substring(0, colonIndex).trim();
        const valuePart = trimmedLine.substring(colonIndex + 1).trim();

        if (category.toLowerCase().includes('idioma') || category.toLowerCase().includes('language')) {
          const langResult = this.parseLanguageFromLine(valuePart, languageKeywordsEs, languageKeywordsEn);
          if (langResult) {
            languages.push(langResult);
          }
        } else {
          const parsedSkills = this.parseSkillsList(valuePart);
          const existing = skillsMap.get(category) || [];
          skillsMap.set(category, [...existing, ...parsedSkills]);
        }
        continue;
      }

      if (trimmedLine.startsWith('-')) {
        const cleaned = trimmedLine.replace(/^-\s*/, '');
        const parsedSkills = this.parseSkillsList(cleaned);

        for (const skill of parsedSkills) {
          const langResult = this.detectLanguageInText(skill, languageKeywordsEs, languageKeywordsEn);
          if (langResult && !languages.some(l => l.language === langResult.language)) {
            languages.push(langResult);
          } else {
            const existing = skillsMap.get('General') || [];
            if (!existing.includes(skill)) {
              skillsMap.set('General', [...existing, skill]);
            }
          }
        }
        continue;
      }

      const commaSkills = trimmedLine.split(',').map(s => s.trim()).filter(s => s.length > 1);
      for (const skill of commaSkills) {
        const langResult = this.detectLanguageInText(skill, languageKeywordsEs, languageKeywordsEn);
        if (langResult && !languages.some(l => l.language === langResult.language)) {
          languages.push(langResult);
        } else if (!skill.includes(':') && !skill.match(/^\d{4}/)) {
          const cleanedSkill = skill.replace(/[.,;:]\s*$/, '').trim();
          if (cleanedSkill) {
            const existing = skillsMap.get('General') || [];
            if (!existing.includes(cleanedSkill)) {
              skillsMap.set('General', [...existing, cleanedSkill]);
            }
          }
        }
      }
    }

    const skills: SkillCategory[] = Array.from(skillsMap.entries()).map(([category, items]) => ({ category, items }));
    return { skills, languages };
  }

  private parseLanguageFromLine(line: string, langKeywordsEs: string[], langKeywordsEn: string[]): { language: string; level: string } | null {
    const allLangKeywords = [...langKeywordsEs, ...langKeywordsEn];

    for (const lang of allLangKeywords) {
      if (line.includes(lang)) {
        const level = this.extractLevel(line) || 'Intermediate';
        const languageName = lang === 'Inglés' ? 'English' : lang === 'Español' ? 'Spanish' : lang;
        return { language: languageName, level };
      }
    }
    return null;
  }

  private detectLanguageInText(text: string, langKeywordsEs: string[], langKeywordsEn: string[]): { language: string; level: string } | null {
    const allLangKeywords = [...langKeywordsEs, ...langKeywordsEn];

    for (const lang of allLangKeywords) {
      if (text.includes(lang)) {
        const level = this.extractLevel(text) || 'Intermediate';
        const languageName = lang === 'Inglés' ? 'English' : lang === 'Español' ? 'Spanish' : lang;
        return { language: languageName, level };
      }
    }

    const englishMatch = text.match(/Ingl[eé]s\s*\(([^)]+)\)/i);
    if (englishMatch) {
      return { language: 'English', level: englishMatch[1] };
    }

    return null;
  }

  private extractLevel(text: string): string | null {
    const levelKeywords = ['Nativo', 'Native', 'Avanzado', 'Advanced', 'Intermedio', 'Intermediate', 'Básico', 'Basic', 'Fluent', 'Proficient'];

    for (const level of levelKeywords) {
      if (text.includes(level)) {
        return level;
      }
    }

    const parenMatch = text.match(/\(([^)]+)\)/);
    if (parenMatch) {
      return parenMatch[1];
    }

    return null;
  }

  private parseSkillsList(line: string): string[] {
    const skills: string[] = [];
    const separators = /[,;|]/;
    const parts = line.split(separators).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);

    for (const part of parts) {
      const cleaned = part.replace(/[.,;:]\s*$/, '').trim();

      if (cleaned.match(/^\d{4}$/) || cleaned.match(/^-+$/) || cleaned.match(/^Tecnologias?$/i) || cleaned.match(/^Herramientas?$/i)) {
        continue;
      }

      if (cleaned && !cleaned.includes('@') && !cleaned.startsWith('http') && !cleaned.match(/^(Frontend|Backend|Testing|Herramientas)/i)) {
        skills.push(cleaned);
      }
    }

    return skills;
  }

  private mergeLanguages(existing: Array<{ language: string; level: string }>, newOnes: Array<{ language: string; level: string }>): Array<{ language: string; level: string }> {
    const result = [...existing];

    for (const lang of newOnes) {
      if (!result.some(l => l.language === lang.language)) {
        result.push(lang);
      }
    }

    return result;
  }
}