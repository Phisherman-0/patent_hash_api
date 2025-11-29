import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Ensure directory exists, create if it doesn't
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate unique filename using hash
 */
export function generateUniqueFilename(originalName: string, prefix: string = ''): string {
  const hash = crypto.createHash('md5').update(originalName + Date.now()).digest('hex');
  const ext = path.extname(originalName);
  return prefix ? `${prefix}_${hash}${ext}` : `${hash}${ext}`;
}

/**
 * Delete file if it exists
 */
export function deleteFileIfExists(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Read file as buffer
 */
export function readFileBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}
