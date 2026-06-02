import type { CVData, SkillCategory } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';

export interface CVLabels {
  profile: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
}

interface DocDefinition {
  content: any[];
  styles: Record<string, any>;
  defaultStyle: { font: string; fontSize: number };
  pageSize: string;
  pageMargins: [number, number, number, number];
}

export class CVDataToPdfmakeConverter {
  private getLabels(lang: Language): CVLabels {
    return lang === 'es'
      ? {
          profile: 'PERFIL',
          experience: 'EXPERIENCIA PROFESIONAL',
          education: 'EDUCACIÓN',
          skills: 'HABILIDADES',
          languages: 'IDIOMAS',
        }
      : {
          profile: 'PROFILE',
          experience: 'EXPERIENCE',
          education: 'EDUCATION',
          skills: 'SKILLS',
          languages: 'LANGUAGES',
        };
  }

  private parseSkillHighlights(text: string): any[] {
    const parts: any[] = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index) });
      }
      parts.push({ text: match[1], bold: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ text }];
  }

  private formatSkillsByCategory(skills: SkillCategory[]): any[] {
    const result: any[] = [];

    for (const skillCat of skills) {
      const formattedItems = skillCat.items.join(' - ');
      result.push([
        { text: `${skillCat.category}: `, bold: true },
        { text: formattedItems, bold: false },
      ]);
    }

    return result;
  }

  private createSectionHeader(title: string): any[] {
    return [
      { text: title, style: 'sectionTitle' },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 3,
            x2: 545,
            y2: 3,
            lineWidth: 0.5,
            lineColor: '#333',
          },
        ],
        margin: [0, 2, 0, 4] as [number, number, number, number],
      },
    ];
  }

  toDocDefinition(cvData: CVData, lang: Language): DocDefinition {
    const labels = this.getLabels(lang);
    const content: any[] = [];

    content.push({ text: cvData.name.toUpperCase(), style: 'name', alignment: 'center' });

    const contactParts: string[] = [];
    if (cvData.contact.location) contactParts.push(cvData.contact.location);
    if (cvData.contact.phone) contactParts.push(cvData.contact.phone);
    
    const linksParts: string[] = [];
    if (cvData.contact.email) linksParts.push(cvData.contact.email);
    if (cvData.contact.github) linksParts.push(cvData.contact.github);
    if (cvData.contact.linkedin) linksParts.push(cvData.contact.linkedin);

    if (contactParts.length > 0) {
      content.push({ text: contactParts.join('  •  '), style: 'contactLine', alignment: 'center' });
    }
    if (linksParts.length > 0) {
      content.push({ text: linksParts.join('  •  '), style: 'contactLine', alignment: 'center' });
    }

    content.push({ text: '\n' });

    if (cvData.summary) {
      const profileSection = this.createSectionHeader(labels.profile);
      content.push(...profileSection);
      content.push({ text: cvData.summary, style: 'summaryText' });
      content.push({ text: '\n' });
    }

    if (cvData.experience && cvData.experience.length > 0) {
      const expSection = this.createSectionHeader(labels.experience);
      content.push(...expSection);

      cvData.experience.forEach((exp, index) => {
        content.push({
          columns: [
            { text: exp.title.toUpperCase(), style: 'jobTitle', width: '*' },
            { text: `${exp.start_date || ''} – ${exp.end_date || ''}`, style: 'jobDate', width: 'auto' },
          ],
          marginBottom: 2,
        });

        if (exp.company) {
          content.push({ text: exp.company, style: 'company', marginBottom: 3 });
        }

        if (exp.description) {
          const parsedDescription = this.parseSkillHighlights(exp.description);
          content.push({ text: parsedDescription, style: 'jobDescription', marginBottom: index < cvData.experience.length - 1 ? 10 : 6 });
        } else {
          content.push({ text: '', style: 'jobDescription', marginBottom: 10 });
        }
      });

      content.push({ text: '\n' });
    }

    if (cvData.education && cvData.education.length > 0) {
      const eduSection = this.createSectionHeader(labels.education);
      content.push(...eduSection);

      cvData.education.forEach((edu, index) => {
        content.push({
          columns: [
            { text: edu.degree.toUpperCase(), style: 'degree', width: '*' },
            { text: edu.year || '', style: 'degreeDate', width: 'auto' },
          ],
          marginBottom: 2,
        });
        content.push({ text: edu.institution, style: 'institution', marginBottom: index < cvData.education.length - 1 ? 8 : 6 });
      });

      content.push({ text: '\n' });
    }

    if (cvData.skills && cvData.skills.length > 0) {
      const skillsSection = this.createSectionHeader(labels.skills);
      content.push(...skillsSection);

      const formattedSkills = this.formatSkillsByCategory(cvData.skills);

      for (const skillLine of formattedSkills) {
        content.push({ text: skillLine, style: 'skillItem' });
      }

      content.push({ text: '\n' });
    }

    if (cvData.languages && cvData.languages.length > 0) {
      const langSection = this.createSectionHeader(labels.languages);
      content.push(...langSection);

      const langItems = cvData.languages.map(l =>
        l.level ? `${l.language} (${l.level})` : l.language
      );
      content.push({ text: langItems.join('  •  '), style: 'languageItem', marginBottom: 2 });
    }

    return {
      content,
      styles: {
        name: { fontSize: 20, bold: true, alignment: 'center', marginBottom: 4 },
        contactLine: { fontSize: 9, alignment: 'center', marginBottom: 1, color: '#444' },
        sectionTitle: { fontSize: 11, bold: true, marginBottom: 0 },
        summaryText: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },
        jobTitle: { fontSize: 11, bold: true },
        jobDate: { fontSize: 9, color: '#666' },
        company: { fontSize: 10, italics: true, color: '#555', marginBottom: 3 },
        jobDescription: { fontSize: 10, lineHeight: 1.4 },
        degree: { fontSize: 11, bold: true },
        degreeDate: { fontSize: 9, color: '#666' },
        institution: { fontSize: 10, italics: true, color: '#555', marginBottom: 8 },
        skillItem: { fontSize: 10, marginBottom: 0, lineHeight: 1.2 },
        languageItem: { fontSize: 10 },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      pageSize: 'A4',
      pageMargins: [25, 25, 25, 25] as [number, number, number, number],
    };
  }
}