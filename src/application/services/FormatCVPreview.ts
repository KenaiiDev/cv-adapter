import type { CVData } from '../../domain/entities/CVData.js';

export function formatCVPreview(cvData: CVData): string {
  const contactDetails = [cvData.contact.location, cvData.contact.phone].filter(Boolean);
  const links = [cvData.contact.email, cvData.contact.github, cvData.contact.linkedin].filter(Boolean);
  const sections = [
    [
      'Generated CV preview',
      '',
      cvData.name,
      ...(contactDetails.length > 0 ? [contactDetails.join(' | ')] : []),
      ...(links.length > 0 ? [links.join(' | ')] : []),
    ],
    previewSection('Profile', [cvData.summary]),
    previewSection('Experience', cvData.experience.flatMap((experience) => [
      `${experience.title} | ${experience.start_date} – ${experience.end_date}`,
      experience.company,
      experience.description,
    ])),
    previewSection('Education', cvData.education.flatMap((education) => [
      `${education.degree} | ${education.year}`,
      education.institution,
    ])),
    previewSection('Skills', cvData.skills.map((skill) => `${skill.category}: ${skill.items.join(' - ')}`)),
    previewSection('Languages', cvData.languages.map((language) => (
      language.level ? `${language.language} (${language.level})` : language.language
    ))),
  ];

  return sections
    .filter((section) => section.length > 0)
    .map((section) => section.join('\n'))
    .join('\n\n');
}

function previewSection(title: string, lines: string[]): string[] {
  const visibleLines = lines.filter(Boolean);
  return visibleLines.length > 0 ? [title, ...visibleLines] : [];
}
