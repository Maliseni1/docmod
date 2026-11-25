import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile, getFormatsByCategory, detectCategory } from '../services/api';
import posthog, { conversionLogger, isPostHogConfigured } from '../posthog.js';
import { CategoryIcon, UploadCloudIcon, DownloadIcon, AlertIcon } from './icons';

const captureEvent = (event, properties) => {
  if (isPostHogConfigured) {
    posthog.capture(event, properties);
  }
};

const CATEGORY_LABELS = {
  image: 'Image File',
  document: 'Document',
  video: 'Video',
  audio: 'Audio',
  archive: 'Archive',
  unknown: 'File'
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

const CATEGORY_HINTS = {
  image: 'Converts between PNG, JPEG, WebP, AVIF, GIF, TIFF, BMP',
  document: 'Converts DOCX→HTML, TXT→HTML, PDF optimization',
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

    const detected = detectCategory(uploaded.name);
    setCategory(detected);

    if (detected === 'unknown') {
      captureEvent('unsupported_file_selected');
      setError('This file type is not supported yet. Try an image or document.');
      return;
    }

    captureEvent('file_selected', { file_category: detected });

    try {
      const { data } = await getFormatsByCategory(detected);
      if (data.conversions && data.conversions.length > 0) {
        setFormats(data.conversions);
        setTarget(data.conversions[0].to);
      } else {
        setError(`No conversion options available for ${CATEGORY_LABELS[detected]} yet.`);
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
      setResult({ url: URL.createObjectURL(blob), filename: `${baseName}.${target}` });
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

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setCategory(null);
    setFormats([]);
    setTarget('');
    setResult(null);
    setError(null);
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
      </div>

      {category && category !== 'unknown' && formats.length > 0 && (
        <div className="controls">
          <div className="control-group">
            <label>Detected Type</label>
            <div className={`category-badge ${category}`}>
              <CategoryIcon category={category} /> {CATEGORY_LABELS[category]}
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
