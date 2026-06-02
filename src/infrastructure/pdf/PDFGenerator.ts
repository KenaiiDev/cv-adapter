import { createRequire } from 'module';
import type { CVData } from '../../domain/entities/CVData.js';
import type { Language } from '../../interfaces/IAIProvider.js';
import type { IPDFGenerator } from '../../interfaces/IPDFGenerator.js';
import { CVDataToPdfmakeConverter } from './CVDataToPdfmakeConverter.js';

const require = createRequire(import.meta.url);

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

export class PDFGenerator implements IPDFGenerator {
  async generate(cvData: CVData, language: Language): Promise<Buffer> {
    const converter = new CVDataToPdfmakeConverter();
    const docDefinition = converter.toDocDefinition(cvData, language);

    const pdfmake = require('pdfmake/js/index.js');
    pdfmake.addFonts(fonts);

    const doc = pdfmake.createPdf(docDefinition);
    const pdfDoc = await doc.pdfDocumentPromise;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}

export const pdfGenerator = new PDFGenerator();