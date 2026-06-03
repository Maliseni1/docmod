import path from 'path';
import { ConverterFactory } from '../converters/ConverterFactory.js';
import { FileTypeClassifier } from '../utils/FileTypeClassifier.js';

/**
 * GRASP: High Cohesion
 * Only job: orchestrate the conversion pipeline.
 */
export class ConversionService {
  async process(inputPath, targetFormat) {
    const fromExt = path.extname(inputPath).slice(1).toLowerCase();
    const toExt = targetFormat.toLowerCase();
    const category = FileTypeClassifier.classify(path.basename(inputPath));

    const ConverterClass = ConverterFactory.resolve(fromExt, toExt);
    if (!ConverterClass) {
      throw new Error(`Conversion from ${fromExt} to ${toExt} is not supported`);
    }

    const outputPath = this._generateOutputPath(inputPath, toExt);
    const converter = new ConverterClass(inputPath, outputPath);

    const result = await converter.convert();
    return { ...result, category, downloadFilename: path.basename(outputPath) };
  }

  _generateOutputPath(inputPath, toExt) {
    const base = path.basename(inputPath, path.extname(inputPath));
    const filename = `${base}-${Date.now()}.${toExt}`;
    return path.join(path.dirname(inputPath), filename);
  }
}
