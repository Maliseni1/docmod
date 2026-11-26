import mammoth from 'mammoth';
import { promises as fs } from 'fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { BaseConverter } from './BaseConverter.js';

/**
 * GRASP: Information Expert
 * DOCX->PDF via mammoth (DOCX->HTML, already used elsewhere) piped through
 * a real headless Chromium so formatting/tables/images render correctly -
 * not a hand-rolled layout approximation. Uses @sparticuz/chromium, a
 * Chromium build specifically compressed to fit a serverless function's
 * size limit, instead of a full LibreOffice/Pandoc install.
 */
export class ChromiumPdfConverter extends BaseConverter {
  async convert() {
    const buffer = await fs.readFile(this.inputPath);
    const { value: bodyHtml } = await mammoth.convertToHtml({ buffer });
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1C1A17; }
  img { max-width: 100%; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 0.4rem 0.6rem; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: this.outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
      });
    } finally {
      await browser.close();
    }

    return {
      success: true,
      outputPath: this.outputPath,
      metadata: { type: 'document', engine: 'chromium' }
    };
  }

  static getSupportedConversions() {
    return [{ from: 'docx', to: 'pdf' }];
  }

  static get category() {
    return 'document';
  }

  // Spawns a real browser process - gate concurrency like Pandoc/LibreOffice.
  static get isHeavy() {
    return true;
  }
}
