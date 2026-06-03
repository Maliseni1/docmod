import path from 'path';
import fs from 'fs/promises';
import { ConversionService } from '../services/ConversionService.js';
import { ConverterFactory } from '../converters/ConverterFactory.js';
import { FileTypeClassifier } from '../utils/FileTypeClassifier.js';

/**
 * GRASP: Controller
 * Handles HTTP concerns only. No conversion logic here.
 */
export class ConversionController {
  constructor() {
    this.service = new ConversionService();
  }

  convert = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const targetFormat = req.body.targetFormat;
      if (!targetFormat) {
        return res.status(400).json({ error: 'targetFormat is required' });
      }

      const result = await this.service.process(req.file.path, targetFormat);

      // Schedule cleanup after 5 minutes (Render disk is ephemeral, but good practice)
      setTimeout(() => this._cleanup(req.file.path, result.outputPath), 5 * 60 * 1000);

      return res.json({
        success: true,
        downloadUrl: `/api/download?file=${encodeURIComponent(result.downloadFilename)}`,
        metadata: result.metadata,
        category: result.category
      });
    } catch (err) {
      next(err);
    }
  };

  download = async (req, res, next) => {
    try {
      const filename = req.query.file;
      if (!filename) return res.status(400).json({ error: 'Missing file parameter' });

      // Security: prevent path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      const filePath = path.resolve('./uploads', filename);
      res.download(filePath, (err) => {
        if (err) next(err);
      });
    } catch (err) {
      next(err);
    }
  };

  getSupportedFormats = async (req, res) => {
    const supported = ConverterFactory.getAllSupported();
    res.json({ conversions: supported });
  };

  getFormatsByCategory = async (req, res) => {
    const { category } = req.params;
    const validCategories = ConverterFactory.getCategories();
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category', validCategories });
    }
    const supported = ConverterFactory.getSupportedByCategory(category);
    res.json({ category, conversions: supported });
  };

  getFileCategory = async (req, res) => {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'filename query param required' });
    const category = FileTypeClassifier.classify(filename);
    res.json({ filename, category });
  };

  async _cleanup(...paths) {
    for (const p of paths) {
      try { await fs.unlink(p); } catch { /* ignore */ }
    }
  }
}
