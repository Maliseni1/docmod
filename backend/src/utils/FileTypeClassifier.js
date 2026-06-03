export const FILE_CATEGORIES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  UNKNOWN: 'unknown'
};

/**
 * GRASP: Information Expert
 * Knows everything about file type classification.
 */
export class FileTypeClassifier {
  static #imageExts = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg', 'ico']);
  static #documentExts = new Set(['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'rtf', 'odt', 'ods', 'odp', 'html', 'htm']);
  static #videoExts = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']);
  static #audioExts = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']);
  static #archiveExts = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2']);

  static classify(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (this.#imageExts.has(ext)) return FILE_CATEGORIES.IMAGE;
    if (this.#documentExts.has(ext)) return FILE_CATEGORIES.DOCUMENT;
    if (this.#videoExts.has(ext)) return FILE_CATEGORIES.VIDEO;
    if (this.#audioExts.has(ext)) return FILE_CATEGORIES.AUDIO;
    if (this.#archiveExts.has(ext)) return FILE_CATEGORIES.ARCHIVE;
    return FILE_CATEGORIES.UNKNOWN;
  }

  static getExtensionsByCategory(category) {
    const map = {
      [FILE_CATEGORIES.IMAGE]: Array.from(this.#imageExts),
      [FILE_CATEGORIES.DOCUMENT]: Array.from(this.#documentExts),
      [FILE_CATEGORIES.VIDEO]: Array.from(this.#videoExts),
      [FILE_CATEGORIES.AUDIO]: Array.from(this.#audioExts),
      [FILE_CATEGORIES.ARCHIVE]: Array.from(this.#archiveExts)
    };
    return map[category] || [];
  }
}
