import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/svg+xml',
  'image/x-icon',
]);

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|svg)$/i;

function isAllowedUpload(file) {
  if (ALLOWED_MIMES.has(file.mimetype)) return true;
  if (IMAGE_EXT.test(file.originalname)) return true;
  if (file.mimetype === 'application/octet-stream' && IMAGE_EXT.test(file.originalname)) return true;
  return false;
}

const fileFilter = (req, file, cb) => {
  if (!file.originalname) {
    return cb(null, false);
  }
  if (isAllowedUpload(file)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (${file.mimetype || 'unknown'}). Use JPEG, PNG, GIF, or WebP.`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function inferContentType(file) {
  if (file.mimetype && file.mimetype !== 'application/octet-stream') {
    return file.mimetype;
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
  };
  return map[ext] || 'application/octet-stream';
}
