import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseConverter } from './BaseConverter.js';
import { BinaryChecker } from '../utils/BinaryChecker.js';

export class PandocConverter extends BaseConverter {
  async convert() {
    if (!BinaryChecker.has('pandoc')) {
      throw new Error('Pandoc is not installed on this server.');
    }

    const fromExt = path.extname(this.inputPath).slice(1).toLowerCase();
    const toExt = path.extname(this.outputPath).slice(1).toLowerCase();

    const formatMap = {
      docx: 'docx', pdf: 'pdf', html: 'html', 
      txt: 'plain', md: 'markdown', epub: 'epub',
      odt: 'odt', rtf: 'rtf'
    };

    const fromFormat = formatMap[fromExt] || fromExt;
    const toFormat = formatMap[toExt] || toExt;

    // Special case: DOCX→PDF with no LaTeX → convert to HTML first, then WeasyPrint
    if (fromExt === 'docx' && toExt === 'pdf' && !this.#hasLatex()) {
      if (BinaryChecker.has('weasyprint')) {
        return this.#docxToPdfViaWeasyPrint(fromFormat);
      }
      throw new Error('No PDF engine available. Install texlive-xetex, weasyprint, or libreoffice.');
    }

    return this.#runPandoc(fromFormat, toFormat, toExt);
  }

  #hasLatex() {
    return BinaryChecker.has('xelatex') || BinaryChecker.has('lualatex') || BinaryChecker.has('pdflatex');
  }

  async #runPandoc(fromFormat, toFormat, toExt) {
    return new Promise((resolve, reject) => {
      const args = [
        this.inputPath,
        '-f', fromFormat,
        '-t', toFormat,
        '-o', this.outputPath,
        '--resource-path', path.dirname(this.inputPath)
      ];

      if (toExt === 'pdf') {
        const engines = ['xelatex', 'lualatex', 'pdflatex'];
        const available = engines.find(e => BinaryChecker.has(e));
        if (available) args.push(`--pdf-engine=${available}`);
      }

      const proc = spawn('pandoc', args, { timeout: 120000 });
      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', async (code) => {
        if (code !== 0) {
          try { await fs.unlink(this.outputPath); } catch {}
          return reject(new Error(`Pandoc failed (code ${code}): ${stderr || 'Unknown error'}`));
        }
        try {
          await fs.access(this.outputPath);
          resolve({
            success: true,
            outputPath: this.outputPath,
            metadata: { type: 'document', engine: 'pandoc', from: fromFormat, to: toFormat }
          });
        } catch {
          reject(new Error('Pandoc reported success but output file was not created'));
        }
      });

      proc.on('error', (err) => reject(new Error(`Failed to spawn Pandoc: ${err.message}`)));
    });
  }

  async #docxToPdfViaWeasyPrint(fromFormat) {
    // Step 1: DOCX → HTML
    const htmlPath = this.outputPath.replace('.pdf', '.html');
    await this.#runPandoc(fromFormat, 'html', 'html', htmlPath);
    
    // Step 2: HTML → PDF via WeasyPrint
    return new Promise((resolve, reject) => {
      const proc = spawn('weasyprint', [htmlPath, this.outputPath], { timeout: 120000 });
      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', async (code) => {
        // Cleanup temp HTML
        try { await fs.unlink(htmlPath); } catch {}
        
        if (code !== 0) {
          try { await fs.unlink(this.outputPath); } catch {}
          return reject(new Error(`WeasyPrint failed (code ${code}): ${stderr || 'Unknown error'}`));
        }
        resolve({
          success: true,
          outputPath: this.outputPath,
          metadata: { type: 'document', engine: 'pandoc+weasyprint' }
        });
      });

      proc.on('error', (err) => reject(new Error(`Failed to spawn WeasyPrint: ${err.message}`)));
    });
  }

  static getSupportedConversions() {
    if (!BinaryChecker.has('pandoc')) return [];
    
    const formats = ['docx', 'pdf', 'html', 'txt', 'md', 'epub', 'odt', 'rtf'];
    const conversions = [];
    const hasLatex = BinaryChecker.has('xelatex') || BinaryChecker.has('lualatex') || BinaryChecker.has('pdflatex');
    const hasWeasyPrint = BinaryChecker.has('weasyprint');
    
    for (const from of formats) {
      for (const to of formats) {
        if (from === to) continue;
        
        // DOCX→PDF needs LaTeX or WeasyPrint
        if (from === 'docx' && to === 'pdf' && !hasLatex && !hasWeasyPrint) continue;
        
        conversions.push({ from, to });
      }
    }
    return conversions;
  }

  static get category() {
    return 'document';
  }
}