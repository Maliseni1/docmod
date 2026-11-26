import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile, getFormatsByCategory, detectCategory } from '../services/api';
import posthog, { conversionLogger, isPostHogConfigured } from '../posthog.js';
import { CategoryIcon, UploadCloudIcon, DownloadIcon, ShareIcon, AlertIcon } from './icons';

// Feature-detect once: can this browser share actual files (not just
// text/links)? Mainly desktop Firefox lacks this - it falls back to the
// plain download link.
function canShareFiles() {
  try {
    const probe = new File([''], 'probe.txt', { type: 'text/plain' });
    return !!(navigator.canShare && navigator.canShare({ files: [probe] }));
  } catch {
    return false;
  }
}

const captureEvent = (event, properties) => {
  if (isPostHogConfigured) {
    posthog.capture(event, properties);
  }
};

// With responseType: 'blob', axios decodes error bodies as a Blob too
// (even though the server sent JSON), so it has to be read back out.
async function extractErrorMessage(err) {
  const data = err.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed.error || 'Conversion failed. Please try again.';
    } catch {
      return 'Conversion failed. Please try again.';
    }
  }
  return data?.error || 'Conversion failed. Please try again.';
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'tiff', 'bmp'];

const CATEGORY_HINTS = {
  image: 'Converts between PNG, JPEG, WebP, AVIF, GIF, TIFF, BMP',
  document: 'Converts DOCX↔PDF, DOCX→HTML, TXT→HTML, PDF optimization',
  video: 'Coming soon — FFmpeg integration',
  audio: 'Coming soon — FFmpeg integration',
  archive: 'Coming soon — archive extraction',
  unknown: 'Unsupported file type'
};

export default function Converter() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(null);
  const [formats, setFormats] = useState([]);
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState(null);
  const [fileExt, setFileExt] = useState('');
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    setShareSupported(canShareFiles());
  }, []);

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const uploaded = accepted[0];
    setFile(uploaded);
    setResult(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setError(null);
    setFormats([]);
    setTarget('');

    const ext = uploaded.name.split('.').pop().toLowerCase();
    setFileExt(ext);

    const detected = detectCategory(uploaded.name);
    setCategory(detected);

    setSourcePreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      // Images only: an <iframe>-rendered PDF preview isn't reliable across
      // browsers - some are configured to download/open PDFs externally
      // instead of rendering them inline, which hijacks the page.
      return detected === 'image' ? URL.createObjectURL(uploaded) : null;
    });

    if (detected === 'unknown') {
      captureEvent('unsupported_file_selected');
      setError('This file type is not supported yet. Try an image or document.');
      return;
    }

    captureEvent('file_selected', { file_category: detected });

    try {
      const { data } = await getFormatsByCategory(detected);
      const relevant = (data.conversions || []).filter(fmt => fmt.from === ext);
      if (relevant.length > 0) {
        setFormats(relevant);
        setTarget(relevant[0].to);
      } else {
        setError(`No conversion options available for .${ext} files yet.`);
      }
    } catch (err) {
      captureEvent('conversion_options_load_failed', { file_category: detected });
      setError('Could not load conversion options. Please try again.');
      setFormats([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false
  });

  const handleConvert = async () => {
    if (!file || !target) return;
    setLoading(true);
    setError(null);
    captureEvent('conversion_started', {
      file_category: category,
      target_format: target
    });
    conversionLogger.info('conversion request started', {
      file_category: category,
      target_format: target
    });
    try {
      const { data: blob } = await uploadFile(file, target);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      if (result?.url) URL.revokeObjectURL(result.url);

      const ext = target.toLowerCase();
      let previewType = null;
      let previewContent = null;
      if (IMAGE_EXTS.includes(ext)) {
        previewType = 'image';
      } else if (ext === 'html') {
        previewType = 'html';
        previewContent = await blob.text();
      } else if (ext === 'txt') {
        previewType = 'text';
        previewContent = await blob.text();
      } else {
        // No reliable in-browser renderer for this format: PDF relies on
        // each browser's own PDF-handling setting (some download/open it
        // externally instead of rendering inline, which hijacks the page),
        // and DOCX can't be rendered at all without a heavy library. Show
        // something instead of nothing, rather than leaving a blank gap.
        previewType = 'generic';
      }

      setResult({
        url: URL.createObjectURL(blob),
        blob,
        filename: `${baseName}-docmod-${Date.now()}.${target}`,
        previewType,
        previewContent
      });
      captureEvent('conversion_completed', {
        file_category: category,
        target_format: target
      });
      conversionLogger.info('conversion request completed', {
        file_category: category,
        target_format: target
      });
    } catch (err) {
      captureEvent('conversion_failed', {
        file_category: category,
        target_format: target
      });
      conversionLogger.error('conversion request failed', {
        file_category: category,
        target_format: target
      });
      setError(await extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result?.blob) return;
    const file = new File([result.blob], result.filename, { type: result.blob.type });
    try {
      await navigator.share({ files: [file], title: 'DocMod' });
      captureEvent('converted_file_shared', {
        file_category: category,
        target_format: target
      });
    } catch (err) {
      // AbortError just means the user closed the share sheet - not an error.
      if (err.name !== 'AbortError') {
        setError('Could not share the file. Try downloading instead.');
      }
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    setFile(null);
    setCategory(null);
    setFormats([]);
    setTarget('');
    setResult(null);
    setError(null);
    setSourcePreviewUrl(null);
    setFileExt('');
  };

  return (
    <div className="converter-card">
      <div className="brand">
        <h1>DocMod</h1>
      </div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon">
          {category ? <CategoryIcon category={category} /> : <UploadCloudIcon />}
        </div>
        <div className="dropzone-text">
          {isDragActive ? 'Drop your file here...' : 'Drag & drop a file, or click to browse'}
        </div>
        {category && (
          <div className="dropzone-hint">{CATEGORY_HINTS[category]}</div>
        )}
        {file && (
          <div className="file-info">
            <CategoryIcon category={category} />
            <span>{file.name}</span>
          </div>
        )}
        {sourcePreviewUrl && (
          <img src={sourcePreviewUrl} alt="" className="source-preview" />
        )}
      </div>

      {category && category !== 'unknown' && formats.length > 0 && (
        <div className="controls">
          <div className="control-group">
            <label>Detected Type</label>
            <div className={`category-badge ${category}`}>
              <CategoryIcon category={category} /> {fileExt}
            </div>
          </div>

          <div className="control-group">
            <label>Convert To</label>
            <select 
              value={target} 
              onChange={e => setTarget(e.target.value)}
              disabled={!formats.length}
            >
              {formats.map((fmt, idx) => (
                <option key={idx} value={fmt.to}>
                  {fmt.to.toUpperCase()}
                </option>
              ))}
            </select>
            {fileExt === 'pdf' && target === 'docx' && (
              <p className="control-note">
                Text only — the original layout, fonts, tables, and images aren't preserved.
              </p>
            )}
          </div>

          <button onClick={handleConvert} disabled={!file || !target || loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Converting...' : 'Convert File'}
          </button>

          {result && (
            <button onClick={handleReset} style={{background: 'transparent', color: 'var(--ink-muted)', boxShadow: 'none', border: '1.5px solid var(--border)'}}>
              Convert Another File
            </button>
          )}
        </div>
      )}

      {error && <div className="error"><AlertIcon /> {error}</div>}

      {result && (
        <div className="result">
          {result.previewType === 'image' && (
            <img src={result.url} alt="" className="result-preview-image" />
          )}
          {result.previewType === 'html' && (
            <iframe
              srcDoc={result.previewContent}
              sandbox=""
              title="Converted preview"
              className="result-preview-frame"
            />
          )}
          {result.previewType === 'text' && (
            <pre className="result-preview-text">{result.previewContent}</pre>
          )}
          {result.previewType === 'generic' && (
            <div className="result-preview-generic">
              <CategoryIcon category={category} />
              <span>{result.filename}</span>
            </div>
          )}
          <div className="result-actions">
            <a
              href={result.url}
              className="download-btn"
              download={result.filename}
              onClick={() => captureEvent('converted_file_downloaded', {
                file_category: category,
                target_format: target
              })}
            >
              <DownloadIcon /> Download {target.toUpperCase()}
            </a>
            {shareSupported && (
              <button type="button" className="share-btn" onClick={handleShare}>
                <ShareIcon /> Share
              </button>
            )}
          </div>
        </div>
      )}

      <div className="features">
        <span className="feature-tag">Smart Detection</span>
        <span className="feature-tag">Secure</span>
        <span className="feature-tag">Fast</span>
      </div>
    </div>
  );
}
