import crypto from 'crypto';

export interface PolicyResult {
  ok: boolean;
  error?: string;
}

export function checkPasswordPolicy(password: string): PolicyResult {
  if (typeof password !== 'string') {
    return { ok: false, error: 'Password must be a string' };
  }
  if (password.length < 10) {
    return { ok: false, error: 'Password must be at least 10 characters' };
  }
  if (password.length > 256) {
    return { ok: false, error: 'Password is too long' };
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (classes < 3) {
    return {
      ok: false,
      error: 'Password must include at least 3 of: lowercase, uppercase, digit, symbol',
    };
  }
  return { ok: true };
}

/**
 * Check HaveIBeenPwned k-anonymity API — only the first 5 chars of the SHA-1
 * hash leave the server. Fails open on network errors.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const body = await res.text();
    for (const line of body.split('\n')) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix === suffix && Number(countStr) > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}
