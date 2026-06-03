import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import { BaseConverter } from './BaseConverter.js';

/**
 * GRASP: Information Expert
 * Handles PDF-specific operations (compression, optimization).
 */
export class PdfConverter extends BaseConverter {
  async convert() {
    const pdfBytes = await fs.readFile(this.inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const compressedBytes = await pdfDoc.save({ 
      useObjectStreams: true,
      addDefaultPage: false
    });
    await fs.writeFile(this.outputPath, compressedBytes);

    return {
      success: true,
      outputPath: this.outputPath,
      metadata: { pageCount: pdfDoc.getPageCount(), type: 'document' }
    };
  }

  static getSupportedConversions() {
    return [
      { from: 'pdf', to: 'pdf' } // Optimization / compression
    ];
  }

  static get category() {
    return 'document';
  }
}
