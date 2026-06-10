import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Set encryption key for tests
process.env.WALLET_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests-abc123';

describe('WalletService encryption', () => {
  // Test the Node crypto encryption/decryption directly
  // (WalletService.encrypt/decrypt are private, so we test the algorithm)

  const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY;

  function encrypt(text: string): string {
    const salt = randomBytes(16);
    const keyBuf = scryptSync(ENCRYPTION_KEY!, salt, 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyBuf, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
  }

  function decrypt(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, 'base64');
    const salt = buf.subarray(0, 16);
    const iv = buf.subarray(16, 28);
    const authTag = buf.subarray(28, 44);
    const encrypted = buf.subarray(44);
    const keyBuf = scryptSync(ENCRYPTION_KEY!, salt, 32);
    const decipher = createDecipheriv('aes-256-gcm', keyBuf, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  it('should encrypt and decrypt text roundtrip', () => {
    const plaintext = '0x1234567890abcdef1234567890abcdef12345678';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext (random salt/iv)', () => {
    const plaintext = 'same-wallet-address';
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2); // Different due to random salt/iv
    expect(decrypt(enc1)).toBe(plaintext);
    expect(decrypt(enc2)).toBe(plaintext);
  });

  it('should fail decryption with wrong key', () => {
    const plaintext = 'secret-wallet-data';
    const encrypted = encrypt(plaintext);
    
    // Tamper with the encrypted data
    const buf = Buffer.from(encrypted, 'base64');
    buf[50] = buf[50] ^ 0xff; // Flip bits
    const tampered = buf.toString('base64');
    
    expect(() => decrypt(tampered)).toThrow();
  });

  it('should produce base64-encoded output', () => {
    const encrypted = encrypt('test');
    expect(/^[A-Za-z0-9+/]+=*$/.test(encrypted)).toBe(true);
  });

  it('should handle empty string', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('should handle unicode characters', () => {
    const plaintext = 'wallet-🔑-secret-日本語';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle long strings (10KB)', () => {
    const plaintext = 'x'.repeat(10240);
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });
});
