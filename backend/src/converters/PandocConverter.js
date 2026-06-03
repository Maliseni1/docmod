import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseConverter } from './BaseConverter.js';
import { BinaryChecker } from '../utils/BinaryChecker.js';

/**
 * GRASP: Information Expert
 * Delegates to Pandoc CLI for document conversions.
 */
export class PandocConverter extends BaseConverter {
  async convert() {
    if (!BinaryChecker.has('pandoc')) {
      throw new Error('Pandoc is not installed on this server. DOCX↔PDF conversion unavailable.');
    }

    const fromExt = path.extname(this.inputPath).slice(1).toLowerCase();
    const toExt = path.extname(this.outputPath).slice(1).toLowerCase();

    // Pandoc format mapping
    const formatMap = {
      docx: 'docx', pdf: 'pdf', html: 'html', 
      txt: 'plain', md: 'markdown', epub: 'epub',
      odt: 'odt', rtf: 'rtf'
    };

    const fromFormat = formatMap[fromExt] || fromExt;
    const toFormat = formatMap[toExt] || toExt;

    return new Promise((resolve, reject) => {
      const args = [
        this.inputPath,
        '-f', fromFormat,
        '-t', toFormat,
        '-o', this.outputPath,
        '--resource-path', path.dirname(this.inputPath)
      ];

      // PDF requires latex engine; pandoc handles this automatically
      if (toExt === 'pdf') {
        args.push('--pdf-engine=xelatex');
      }

      const proc = spawn('pandoc', args, { 
        timeout: 60000 // 60s max for large documents
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', async (code) => {
        if (code !== 0) {
          // Cleanup partial output
          try { await fs.unlink(this.outputPath); } catch {}
          return reject(new Error(`Pandoc failed (code ${code}): ${stderr || 'Unknown error'}`));
        }

        // Verify output exists
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

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn Pandoc: ${err.message}`));
      });
    });
  }

  static getSupportedConversions() {
    if (!BinaryChecker.has('pandoc')) return [];
    
    const formats = ['docx', 'pdf', 'html', 'txt', 'md', 'epub', 'odt', 'rtf'];
    const conversions = [];
    
    for (const from of formats) {
      for (const to of formats) {
        if (from !== to) conversions.push({ from, to });
      }
    }
    return conversions;
  }

  static get category() {
    return 'document';
  }
}