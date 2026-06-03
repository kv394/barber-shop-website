import crypto from 'crypto';

/**
 * SMTP Credential Encryption — AES-256-GCM
 * 
 * Encrypts/decrypts SMTP passwords before storing in the database.
 * Requires SMTP_ENCRYPTION_KEY env var (32-byte hex string).
 * 
 * Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.SMTP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('SMTP_ENCRYPTION_KEY environment variable is required for SMTP credential encryption');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext SMTP password.
 * Returns a combined string: iv:encrypted:authTag (all hex-encoded)
 */
export function encryptSmtpPassword(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypt an encrypted SMTP password.
 * Expects the combined string format: iv:encrypted:authTag
 */
export function decryptSmtpPassword(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential format');
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * SMTP configuration interface stored in Shop.customization.smtp
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // AES-256-GCM encrypted
  fromEmail: string;
  fromName: string;
}

/**
 * Validate SMTP config fields (before saving)
 */
export function validateSmtpConfig(config: Partial<SmtpConfig>): { valid: boolean; error?: string } {
  if (!config.host || typeof config.host !== 'string' || config.host.length > 253) {
    return { valid: false, error: 'SMTP host is required (max 253 chars)' };
  }
  if (!config.port || typeof config.port !== 'number' || config.port < 1 || config.port > 65535) {
    return { valid: false, error: 'SMTP port must be between 1 and 65535' };
  }
  if (!config.username || typeof config.username !== 'string' || config.username.length > 320) {
    return { valid: false, error: 'SMTP username is required' };
  }
  if (!config.password || typeof config.password !== 'string') {
    return { valid: false, error: 'SMTP password is required' };
  }
  if (!config.fromEmail || typeof config.fromEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromEmail)) {
    return { valid: false, error: 'Valid "From" email address is required' };
  }
  return { valid: true };
}
