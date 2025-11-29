import crypto from 'crypto';
import fs from 'fs';

/**
 * Generate SHA-256 hash from a string
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate SHA-256 hash from a file
 */
export function generateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Generate MD5 hash (for file naming)
 */
export function generateMD5Hash(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Verify hash matches data
 */
export function verifyHash(data: string, hash: string): boolean {
  const computedHash = generateHash(data);
  return computedHash === hash;
}

/**
 * Verify file hash matches
 */
export function verifyFileHash(filePath: string, hash: string): boolean {
  const computedHash = generateFileHash(filePath);
  return computedHash === hash;
}
