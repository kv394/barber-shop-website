import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// ENCRYPTION_KEY must be a 64-character hex string (32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : null;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * The output format is: iv:authTag:encryptedText
 *
 * SECURITY: Throws if ENCRYPTION_KEY is not configured — never silently degrades to plaintext.
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set. Cannot encrypt sensitive data. Configure the ENCRYPTION_KEY environment variable.');
  }
  
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with AES-256-GCM.
 * Assumes the input format is: iv:authTag:encryptedText
 */
export function decrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    // During decryption, if key is missing, we can't decrypt — return as-is
    // (data may be legacy plaintext from before encryption was enabled)
    console.warn('ENCRYPTION_KEY is not set. Cannot decrypt.');
    return text;
  }
  
  if (!text) return text;
  
  // If the text doesn't look like our encrypted format (no colons), return as is
  const parts = text.split(':');
  if (parts.length !== 3) {
    return text;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Fallback to returning the encrypted string on failure
  }
}
