import { ImageConverter } from './ImageConverter.js';
import { PdfConverter } from './PdfConverter.js';
import { DocumentConverter } from './DocumentConverter.js';
import { PandocConverter } from './PandocConverter.js';
import { LibreOfficeConverter } from './LibreOfficeConverter.js';

/**
 * GRASP: Creator + Indirection
 * Dynamically registers converters based on available system binaries.
 */
function buildRegistry() {
  const registry = [
    ImageConverter,
    PdfConverter,
    DocumentConverter
  ];

  // Only register if binaries are available
  if (PandocConverter.getSupportedConversions().length > 0) {
    registry.push(PandocConverter);
  }
  if (LibreOfficeConverter.getSupportedConversions().length > 0) {
    registry.push(LibreOfficeConverter);
  }

  return registry;
}

const REGISTRY = buildRegistry();

export class ConverterFactory {
  static resolve(fromExt, toExt) {
    for (const ConverterClass of REGISTRY) {
      const supported = ConverterClass.getSupportedConversions();
      const match = supported.find(c => c.from === fromExt && c.to === toExt);
      if (match) return ConverterClass;
    }
    return null;
  }

  static getAllSupported() {
    return REGISTRY.flatMap(C => 
      C.getSupportedConversions().map(conv => ({
        ...conv,
        category: C.category
      }))
    );
  }

  static getSupportedByCategory(category) {
    return this.getAllSupported().filter(c => c.category === category);
  }

  static getCategories() {
    return [...new Set(REGISTRY.map(C => C.category))];
  }

  static getEngines() {
    return REGISTRY.map(C => C.name).filter(Boolean);
  }
}