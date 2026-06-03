/**
 * GRASP: Protected Variations + Polymorphism
 * Abstract base. All converters must implement this contract.
 */
export class BaseConverter {
  constructor(inputPath, outputPath) {
    if (new.target === BaseConverter) {
      throw new Error('Cannot instantiate abstract BaseConverter directly');
    }
    this.inputPath = inputPath;
    this.outputPath = outputPath;
  }

  /**
   * Must return Promise<{ success: boolean, outputPath: string, metadata?: object }>
   */
  async convert() {
    throw new Error('convert() must be implemented by subclass');
  }

  /**
   * Declare supported input/output pairs
   * @returns {Array<{from: string, to: string}>}
   */
  static getSupportedConversions() {
    return [];
  }

  /**
   * Category for smart filtering (image, document, video, audio, archive)
   */
  static get category() {
    return 'unknown';
  }
}
