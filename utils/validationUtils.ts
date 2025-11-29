import { z } from 'zod';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

/**
 * Validate Hedera account ID format (0.0.xxxxx)
 */
export function isValidHederaAccountId(accountId: string): boolean {
  const hederaAccountPattern = /^0\.0\.\d+$/;
  return hederaAccountPattern.test(accountId);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Validate file type
 */
export function isValidFileType(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeInBytes: number): boolean {
  return size <= maxSizeInBytes;
}
