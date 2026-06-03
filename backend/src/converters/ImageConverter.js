import sharp from 'sharp';
import { BaseConverter } from './BaseConverter.js';

/**
 * GRASP: Information Expert
 * This class knows everything about image conversion via Sharp.
 */
export class ImageConverter extends BaseConverter {
  async convert() {
    const pipeline = sharp(this.inputPath);
    const format = this._getFormat();

    // Format-specific options for quality
    if (format === 'jpeg' || format === 'jpg') pipeline.jpeg({ quality: 90, progressive: true });
    if (format === 'png') pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    if (format === 'webp') pipeline.webp({ quality: 85 });
    if (format === 'avif') pipeline.avif({ quality: 80 });
    if (format === 'gif') pipeline.gif();

    await pipeline.toFile(this.outputPath);

    return {
      success: true,
      outputPath: this.outputPath,
      metadata: { type: 'image', format }
    };
  }

  _getFormat() {
    const ext = this.outputPath.split('.').pop().toLowerCase();
    const formatMap = {
      png: 'png', jpeg: 'jpeg', jpg: 'jpeg', webp: 'webp',
      avif: 'avif', gif: 'gif', tiff: 'tiff', bmp: 'bmp'
    };
    return formatMap[ext] || 'jpeg';
  }

  static getSupportedConversions() {
    const formats = ['png', 'jpeg', 'webp', 'avif', 'gif', 'tiff', 'bmp'];
    const conversions = [];
    for (const from of formats) {
      for (const to of formats) {
        if (from !== to) conversions.push({ from, to });
      }
    }
    // Add jpg alias
    return [...conversions, { from: 'jpg', to: 'png' }, { from: 'jpg', to: 'webp' }, { from: 'jpg', to: 'jpeg' }];
  }

  static get category() {
    return 'image';
  }
}
