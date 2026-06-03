import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseConverter } from './BaseConverter.js';
import { BinaryChecker } from '../utils/BinaryChecker.js';

const SOFFICE_PATHS = [
  'soffice',
  'libreoffice',
  '/usr/bin/soffice',
  '/usr/bin/libreoffice',
  '/usr/lib/libreoffice/program/soffice'
];

export class LibreOfficeConverter extends BaseConverter {
  #findBinary() {
    for (const cmd of SOFFICE_PATHS) {
      if (BinaryChecker.has(cmd)) return cmd;
    }
    return null;
  }

  async convert() {
    const binary = this.#findBinary();
    if (!binary) {
      throw new Error('LibreOffice is not installed on this server.');
    }

    const outputDir = path.dirname(this.outputPath);
    const toExt = path.extname(this.outputPath).slice(1).toLowerCase();

    return new Promise((resolve, reject) => {
      const args = [
        '--headless',
        '--convert-to', toExt,
        '--outdir', outputDir,
        this.inputPath
      ];

      const proc = spawn(binary, args, { timeout: 120000 });
      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', async (code) => {
        if (code !== 0) {
          return reject(new Error(`LibreOffice failed (code ${code}): ${stderr || 'Unknown error'}`));
        }

        const inputBase = path.basename(this.inputPath, path.extname(this.inputPath));
        const loOutput = path.join(outputDir, `${inputBase}.${toExt}`);
        
        if (loOutput !== this.outputPath) {
          try {
            await fs.rename(loOutput, this.outputPath);
          } catch (err) {
            return reject(new Error(`LibreOffice output rename failed: ${err.message}`));
          }
        }

        resolve({
          success: true,
          outputPath: this.outputPath,
          metadata: { type: 'document', engine: 'libreoffice' }
        });
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn LibreOffice: ${err.message}`));
      });
    });
  }

  static getSupportedConversions() {
    const hasLo = SOFFICE_PATHS.some(p => BinaryChecker.has(p));
    if (!hasLo) return [];
    
    const froms = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'odt', 'ods', 'odp', 'rtf'];
    const tos = ['pdf', 'docx', 'html', 'txt', 'odt', 'rtf'];
    const conversions = [];
    
    for (const from of froms) {
      for (const to of tos) {
        if (from !== to) conversions.push({ from, to });
      }
    }
    return conversions;
  }

  static get category() {
    return 'document';
  }
}