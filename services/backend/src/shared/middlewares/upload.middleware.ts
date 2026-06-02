import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const TMP_DIR = path.join(process.cwd(), 'uploads', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TMP_DIR);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Aceitos: JPEG, PNG, WebP, MP4, QuickTime.'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
});

export const uploadMiddleware = upload.single('file');
