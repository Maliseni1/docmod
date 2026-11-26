import { PDFParse } from 'pdf-parse';
import { Document, Packer, Paragraph } from 'docx';
import { promises as fs } from 'fs';
import { BaseConverter } from './BaseConverter.js';

/**
 * GRASP: Information Expert
 * PDF->DOCX via pdf-parse (text extraction) + docx (OOXML writer) - both
 * pure JS, no native binaries. Honest limitation: this recovers the text
 * content as plain reflowed paragraphs. It does not preserve the original
 * layout, fonts, tables, or images - full PDF->DOCX fidelity needs a real
 * layout engine (what LibreOffice/Pandoc do), which this app intentionally
 * doesn't carry to stay deployable as a lightweight serverless function.
 */
export class PdfToDocxConverter extends BaseConverter {
  async convert() {
    const buffer = await fs.readFile(this.inputPath);
    const parser = new PDFParse({ data: buffer });
    let text;
    try {
      ({ text } = await parser.getText());
    } finally {
      await parser.destroy();
    }

    const paragraphs = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => new Paragraph({ text: line }));

    const doc = new Document({
      sections: [{
        children: paragraphs.length ? paragraphs : [new Paragraph({ text: '' })]
      }]
    });
    const docxBuffer = await Packer.toBuffer(doc);
    await fs.writeFile(this.outputPath, docxBuffer);

    return {
      success: true,
      outputPath: this.outputPath,
      metadata: {
        type: 'document',
        engine: 'pdf-parse+docx',
        note: 'Text only - original layout, fonts, tables, and images are not preserved.'
      }
    };
  }

  static getSupportedConversions() {
    return [{ from: 'pdf', to: 'docx' }];
  }

  static get category() {
    return 'document';
  }
}
