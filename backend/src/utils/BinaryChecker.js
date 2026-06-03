import { execSync } from 'child_process';

export class BinaryChecker {
  static #cache = new Map();

  static has(command) {
    if (this.#cache.has(command)) return this.#cache.get(command);
    
    // Handle absolute paths directly
    if (command.startsWith('/')) {
      try {
        const stats = require('fs').statSync(command);
        const exists = stats.isFile();
        this.#cache.set(command, exists);
        return exists;
      } catch {
        this.#cache.set(command, false);
        return false;
      }
    }

    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      this.#cache.set(command, true);
      return true;
    } catch {
      this.#cache.set(command, false);
      return false;
    }
  }

  static getAvailable() {
    return {
      pandoc: this.has('pandoc'),
      libreoffice: this.has('libreoffice'),
      soffice: this.has('soffice'),
      soffice_usr_bin: this.has('/usr/bin/soffice'),
      xelatex: this.has('xelatex'),
      lualatex: this.has('lualatex'),
      pdflatex: this.has('pdflatex'),
      weasyprint: this.has('weasyprint'),
      ffmpeg: this.has('ffmpeg')
    };
  }
}