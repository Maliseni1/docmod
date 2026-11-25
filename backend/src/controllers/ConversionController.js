import path from 'path';
import fs from 'fs/promises';
import { ConversionService } from '../services/ConversionService.js';
import { ConverterFactory } from '../converters/ConverterFactory.js';
import { FileTypeClassifier } from '../utils/FileTypeClassifier.js';

// LibreOffice/Pandoc each spawn a real process; on a memory-constrained host
// (e.g. a free-tier container), running more than one at a time risks an OOM
// kill, so heavy conversions are capped and excess requests are told to retry.
const MAX_CONCURRENT_HEAVY_JOBS = 1;
let activeHeavyJobs = 0;

/**
 * GRASP: Controller
 * Handles HTTP concerns only. No conversion logic here.
 */
export class ConversionController {
  constructor() {
    this.service = new ConversionService();
  }

  convert = async (req, res, next) => {
    let heavySlotTaken = false;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const targetFormat = req.body.targetFormat;
      if (!targetFormat) {
        return res.status(400).json({ error: 'targetFormat is required' });
      }

      const fromExt = path.extname(req.file.path).slice(1).toLowerCase();
      const ConverterClass = ConverterFactory.resolve(fromExt, targetFormat.toLowerCase());

      if (ConverterClass?.isHeavy) {
        if (activeHeavyJobs >= MAX_CONCURRENT_HEAVY_JOBS) {
          await this._cleanup(req.file.path);
          return res.status(503).json({ error: 'Server is busy converting another document. Please try again shortly.' });
        }
        activeHeavyJobs++;
        heavySlotTaken = true;
      }

      const result = await this.service.process(req.file.path, targetFormat);

      // Serverless hosts don't guarantee a shared disk between requests, so
      // the converted file is streamed back in this same response instead of
      // a separate /download call; both temp files are removed once sent.
      res.download(result.outputPath, result.downloadFilename, (err) => {
        this._cleanup(req.file.path, result.outputPath);
        if (err && !res.headersSent) next(err);
      });
    } catch (err) {
      await this._cleanup(req.file.path);
      next(err);
    } finally {
      if (heavySlotTaken) activeHeavyJobs--;
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

  getEngines = async (req, res) => {
    const { BinaryChecker } = await import('../utils/BinaryChecker.js');
    const engines = {
      binaries: BinaryChecker.getAvailable(),
      registeredConverters: ConverterFactory.getEngines(),
      supportedConversions: ConverterFactory.getAllSupported().length
    };
    res.json(engines);
  };

  async _cleanup(...paths) {
    for (const p of paths) {
      try { await fs.unlink(p); } catch { /* ignore */ }
    }
  }
}
