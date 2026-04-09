/**
 * Token Encryption Utility
 * AES-256-GCM encryption for sensitive tokens (Google OAuth, etc.)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM recommended IV length
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Get encryption key from environment.
 * Must be 64 hex chars (32 bytes) — use: openssl rand -hex 32
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Generate: openssl rand -hex 32')
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypt a plaintext token.
 * Returns format: iv:tag:ciphertext (all base64)
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const tag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt an encrypted token.
 * Input format: iv:tag:ciphertext (all base64)
 */
export function decryptToken(encrypted: string): string {
  const key = getEncryptionKey()
  const [ivB64, tagB64, ciphertext] = encrypted.split(':')

  if (!ivB64 || !tagB64 || !ciphertext) {
    throw new Error('Invalid encrypted token format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
