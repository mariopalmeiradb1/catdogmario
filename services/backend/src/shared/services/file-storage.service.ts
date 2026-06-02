import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface FileStorageService {
  save(file: Express.Multer.File): Promise<string>;
  remove(url: string): Promise<void>;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'animals');

export class LocalFileStorage implements FileStorageService {
  constructor() {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  async save(file: Express.Multer.File): Promise<string> {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${crypto.randomUUID()}-${safeName}`;
    const destPath = path.join(UPLOAD_DIR, filename);

    fs.renameSync(file.path, destPath);

    return `/uploads/animals/${filename}`;
  }

  async remove(url: string): Promise<void> {
    const filePath = path.join(process.cwd(), url);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File may already be deleted
    }
  }
}

export const fileStorage: FileStorageService = new LocalFileStorage();
