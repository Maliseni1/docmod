import mammoth from 'mammoth';
import fs from 'fs/promises';
import { BaseConverter } from './BaseConverter.js';

/**
 * GRASP: Information Expert
 * Handles office/document conversions available in pure JS.
 * For DOCX→PDF or PPTX→PDF, Pandoc/LibreOffice is required (not pure JS).
 */
export class DocumentConverter extends BaseConverter {
  async convert() {
    const fromExt = this.inputPath.split('.').pop().toLowerCase();
    const toExt = this.outputPath.split('.').pop().toLowerCase();

    if (fromExt === 'docx' && toExt === 'html') {
      const buffer = await fs.readFile(this.inputPath);
      const result = await mammoth.convertToHtml({ buffer });
      await fs.writeFile(this.outputPath, result.value);
      return {
        success: true,
        outputPath: this.outputPath,
        metadata: { type: 'document', messages: result.messages }
      };
    }

    if (fromExt === 'txt' && toExt === 'html') {
      const text = await fs.readFile(this.inputPath, 'utf-8');
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Converted Document</title></head><body><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;line-height:1.6;padding:2rem;">${escaped}</pre></body></html>`;
      await fs.writeFile(this.outputPath, html);
      return {
        success: true,
        outputPath: this.outputPath,
        metadata: { type: 'document' }
      };
    }

    if (fromExt === 'html' && toExt === 'txt') {
      const html = await fs.readFile(this.inputPath, 'utf-8');
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      await fs.writeFile(this.outputPath, text);
      return {
        success: true,
        outputPath: this.outputPath,
        metadata: { type: 'document' }
      };
    }

    if (fromExt === 'pdf' && toExt === 'pdf') {
      const { PDFDocument } = await import('pdf-lib');
      const pdfBytes = await fs.readFile(this.inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      await fs.writeFile(this.outputPath, compressedBytes);
      return {
        success: true,
        outputPath: this.outputPath,
        metadata: { pageCount: pdfDoc.getPageCount(), type: 'document' }
      };
    }

    throw new Error(
      `Document conversion from ${fromExt} to ${toExt} is not implemented in pure JS. ` +
      `Install Pandoc or LibreOffice and extend this converter.`
    );
  }

  static getSupportedConversions() {
    return [
      { from: 'docx', to: 'html' },
      { from: 'txt', to: 'html' },
      { from: 'html', to: 'txt' },
      { from: 'pdf', to: 'pdf' }
    ];
  }

  static get category() {
    return 'document';
  }
}
