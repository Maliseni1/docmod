import { execSync } from 'child_process';

export class BinaryChecker {
  static #cache = new Map();

  static has(command) {
    if (this.#cache.has(command)) return this.#cache.get(command);
    
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
      xelatex: this.has('xelatex'),
      lualatex: this.has('lualatex'),
      pdflatex: this.has('pdflatex'),
      ffmpeg: this.has('ffmpeg')
    };
  }
}