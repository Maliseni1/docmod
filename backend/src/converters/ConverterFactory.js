import { ImageConverter } from './ImageConverter.js';
import { PdfConverter } from './PdfConverter.js';
import { DocumentConverter } from './DocumentConverter.js';

/**
 * GRASP: Creator + Indirection
 * Centralized object creation. Routes don't "new" converters directly.
 */
const REGISTRY = [
  ImageConverter,
  PdfConverter,
  DocumentConverter
];

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

  static getRegistry() {
    return REGISTRY;
  }
}
