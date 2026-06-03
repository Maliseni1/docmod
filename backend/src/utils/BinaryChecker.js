import { execSync } from 'child_process';

/**
 * GRASP: Information Expert
 * Knows how to check for external binaries on the host system.
 */
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
      libreoffice: this.has('libreoffice') || this.has('soffice'),
      ffmpeg: this.has('ffmpeg')
    };
  }
}