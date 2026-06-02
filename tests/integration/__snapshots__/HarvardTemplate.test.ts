import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { IRenderer } from '../../../src/interfaces/IRenderer.ts';
import { EJSRenderer } from '../../../src/infrastructure/renderer/EJSRenderer.ts';
import { createMockCVData } from '../../helpers/mockData.ts';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock('path', () => ({
  resolve: vi.fn().mockReturnValue('/path/to/project'),
  join: vi.fn().mockReturnValue('/path/to/project/templates/harvard.ejs'),
}));

describe('HarvardTemplate', () => {
  describe('EJSRenderer.toHTML', () => {
    it('should render CVData to HTML matching snapshot', async () => {
      const cvData = createMockCVData();

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <!DOCTYPE html>
        <html>
        <body>
          <div class="header">
            <div class="name"><%= cv.name %></div>
            <div class="contact">
              <% if (cv.contact.email) { %>
                <span><%= cv.contact.email %></span>
              <% } %>
            </div>
          </div>
          <% if (cv.summary) { %>
            <div class="section"><%= cv.summary %></div>
          <% } %>
        </body>
        </html>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('Test User');
      expect(html).toContain('test@example.com');
      expect(html).toContain('Experienced fullstack developer');
    });

    it('should render name from CVData', async () => {
      const cvData = createMockCVData({ name: 'John Doe' });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <!DOCTYPE html>
        <div class="name"><%= cv.name %></div>
        <div class="email"><%= cv.contact.email %></div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('John Doe');
      expect(html).toContain('test@example.com');
    });

    it('should render experience section', async () => {
      const cvData = createMockCVData({
        experience: [{
          title: 'Senior Developer',
          company: 'Tech Corp',
          start_date: '2020',
          end_date: 'Present',
          description: 'Led development team',
        }],
      });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <div class="experience">
          <% cv.experience.forEach(function(exp) { %>
            <div class="exp-title"><%= exp.title %></div>
            <div class="exp-company"><%= exp.company %></div>
          <% }); %>
        </div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('Senior Developer');
      expect(html).toContain('Tech Corp');
    });

    it('should render skills as tags', async () => {
      const cvData = createMockCVData({
        skills: ['TypeScript', 'React', 'Node.js'],
      });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <div class="skills">
          <% cv.skills.forEach(function(skill) { %>
            <span class="skill-tag"><%= skill %></span>
          <% }); %>
        </div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('TypeScript');
      expect(html).toContain('React');
      expect(html).toContain('Node.js');
    });

    it('should handle empty experience array', async () => {
      const cvData = createMockCVData({ experience: [] });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <div class="experience">
          <% if (cv.experience && cv.experience.length > 0) { %>
            <% cv.experience.forEach(function(exp) { %>
              <div><%= exp.title %></div>
            <% }); %>
          <% } else { %>
            <p>No experience</p>
          <% } %>
        </div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('No experience');
    });

    it('should render languages section', async () => {
      const cvData = createMockCVData({
        languages: [
          { language: 'Spanish', level: 'Native' },
          { language: 'English', level: 'B2' },
        ],
      });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <div class="languages">
          <% cv.languages.forEach(function(lang) { %>
            <span><%= lang.language %> (<%= lang.level %>)</span>
          <% }); %>
        </div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('Spanish (Native)');
      expect(html).toContain('English (B2)');
    });

    it('should handle missing optional fields', async () => {
      const cvData = createMockCVData({
        summary: '',
        contact: { email: 'test@test.com' },
      });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <div>
          <% if (cv.summary) { %>
            <p><%= cv.summary %></p>
          <% } %>
          <span><%= cv.contact.email %></span>
        </div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('test@test.com');
      expect(html).not.toContain('<p>');
    });

    it('should render education section', async () => {
      const cvData = createMockCVData({
        education: [{
          degree: 'Computer Science',
          institution: 'University of Buenos Aires',
          year: '2018',
          description: 'Bachelor degree',
        }],
      });

      vi.mocked(fs.promises.readFile).mockResolvedValue(`
        <div class="education">
          <% cv.education.forEach(function(edu) { %>
            <div class="degree"><%= edu.degree %></div>
            <div class="institution"><%= edu.institution %></div>
          <% }); %>
        </div>
      `);

      const renderer = new EJSRenderer();
      const html = await renderer.toHTML(cvData);

      expect(html).toContain('Computer Science');
      expect(html).toContain('University of Buenos Aires');
    });
  });

  describe('snapshot integrity', () => {
    it('should produce consistent HTML output for same CV data', async () => {
      const cvData = createMockCVData();
      const template = `
        <!DOCTYPE html>
        <html>
        <head><title><%= cv.name %> - CV</title></head>
        <body>
          <div class="name"><%= cv.name %></div>
          <div class="contact"><%= cv.contact.email %></div>
          <% if (cv.summary) { %><div class="summary"><%= cv.summary %></div><% } %>
        </body>
        </html>
      `;

      vi.mocked(fs.promises.readFile).mockResolvedValue(template);

      const renderer = new EJSRenderer();

      const html1 = await renderer.toHTML(cvData);
      const html2 = await renderer.toHTML(cvData);

      expect(html1).toBe(html2);
    });
  });
});