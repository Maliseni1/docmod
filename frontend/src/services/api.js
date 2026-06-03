import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const uploadFile = (file, targetFormat) => {
  const form = new FormData();
  form.append('file', file);
  form.append('targetFormat', targetFormat);
  return api.post('/convert', form);
};

export const getSupportedFormats = () => api.get('/formats');

export const getFormatsByCategory = (category) => api.get(`/formats/${category}`);

export const detectCategory = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg', 'ico'];
  const docExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'rtf', 'odt', 'ods', 'odp', 'html', 'htm'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

  if (imageExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (archiveExts.includes(ext)) return 'archive';
  return 'unknown';
};
