import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile, getFormatsByCategory, detectCategory } from '../services/api';

const CATEGORY_ICONS = {
  image: '🖼️',
  document: '📄',
  video: '🎬',
  audio: '🎵',
  archive: '📦',
  unknown: '📎'
};

const CATEGORY_LABELS = {
  image: 'Image File',
  document: 'Document',
  video: 'Video',
  audio: 'Audio',
  archive: 'Archive',
  unknown: 'File'
};

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
    setResult(null);
    setError(null);
    setFormats([]);
    setTarget('');

    const detected = detectCategory(uploaded.name);
    setCategory(detected);

    if (detected === 'unknown') {
      setError('This file type is not supported yet. Try an image or document.');
      return;
    }

    try {
      const { data } = await getFormatsByCategory(detected);
      if (data.conversions && data.conversions.length > 0) {
        setFormats(data.conversions);
        setTarget(data.conversions[0].to);
      } else {
        setError(`No conversion options available for ${CATEGORY_LABELS[detected]} yet.`);
      }
    } catch (err) {
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
    try {
      const { data } = await uploadFile(file, target);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Conversion failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
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
          {category ? CATEGORY_ICONS[category] : '☁️'}
        </div>
        <div className="dropzone-text">
          {isDragActive ? 'Drop your file here...' : 'Drag & drop a file, or click to browse'}
        </div>
        {category && (
          <div className="dropzone-hint">{CATEGORY_HINTS[category]}</div>
        )}
        {file && (
          <div className="file-info">
            <span>{CATEGORY_ICONS[category]}</span>
            <span>{file.name}</span>
          </div>
        )}
      </div>

      {category && category !== 'unknown' && formats.length > 0 && (
        <div className="controls">
          <div className="control-group">
            <label>Detected Type</label>
            <div className={`category-badge ${category}`}>
              {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
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
            <button onClick={handleReset} style={{background: 'transparent', color: 'var(--text-secondary)', boxShadow: 'none', border: '1.5px solid var(--border)'}}>
              Convert Another File
            </button>
          )}
        </div>
      )}

      {error && <div className="error">⚠️ {error}</div>}

      {result && (
        <div className="result">
          <a 
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}${result.downloadUrl}`} 
            className="download-btn"
            download
          >
            ⬇️ Download {target.toUpperCase()}
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
