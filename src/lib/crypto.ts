/**
 * AES-256-GCM encryption/decryption for sensitive data (API keys).
 * Uses ENCRYPTION_KEY env var (32-byte hex string) as the master key.
 * If ENCRYPTION_KEY is not set, data is stored in plaintext (dev mode).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer | null {
  const keyHex = (process.env.ENCRYPTION_KEY || '').trim();
  if (!keyHex || keyHex.length !== 64) return null;
  return Buffer.from(keyHex, 'hex');
}

export function isEncryptionAvailable(): boolean {
  return getEncryptionKey() !== null;
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a string: hex(iv) + ':' + hex(authTag) + ':' + hex(ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) return plaintext; // Dev fallback: no encryption

  const { createCipheriv, randomBytes } = require('crypto') as typeof import('crypto');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a string encrypted with encrypt().
 * If decryption fails or key is missing, returns the original string.
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  if (!key) return ciphertext; // Dev fallback: return as-is

  try {
    const { createDecipheriv } = require('crypto') as typeof import('crypto');
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // If decryption fails, return as-is (might be unencrypted legacy data)
    return ciphertext;
  }
}

/**
 * Generate a random 32-byte hex key for ENCRYPTION_KEY env var.
 * Run this once and set the output as ENCRYPTION_KEY in Vercel.
 */
export function generateEncryptionKey(): string {
  const { randomBytes } = require('crypto') as typeof import('crypto');
  return randomBytes(32).toString('hex');
}
