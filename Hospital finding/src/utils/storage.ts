import { AlbumBook } from '../types';
import { INITIAL_ALBUM } from './initialData';

const STORAGE_KEY = '3d_memory_album_v1';

export const loadAlbum = (): AlbumBook => {
  if (typeof window === 'undefined') return INITIAL_ALBUM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_ALBUM;
    const parsed = JSON.parse(raw) as AlbumBook;
    if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load album from localStorage', e);
  }
  return INITIAL_ALBUM;
};

export const saveAlbum = (album: AlbumBook): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const data = { ...album, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save album to localStorage', e);
    return false;
  }
};

export const resetAlbumToDefault = (): AlbumBook => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return JSON.parse(JSON.stringify(INITIAL_ALBUM));
};

export const exportAlbumJSON = (album: AlbumBook) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(album, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanTitle = album.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadAnchor.setAttribute('download', `${cleanTitle || 'memory_album'}_backup.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Compress uploaded image file to lightweight Base64 to save storage and keep app blazing fast
 */
export const processUploadedFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image file'));
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
