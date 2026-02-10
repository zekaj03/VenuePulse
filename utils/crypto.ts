/**
 * Generate a cryptographically secure unique ID.
 * Falls back to Date.now + Math.random if crypto.randomUUID is unavailable.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a cryptographically secure numeric ID.
 */
export function generateNumericId(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }
  return Date.now();
}

/**
 * Generate a cryptographically secure API key.
 * Uses crypto.getRandomValues instead of Math.random.
 */
export function generateApiKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const chars = Array.from(bytes)
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, 24);
    return `vp_${chars}`;
  }
  // Fallback
  return 'vp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Hash a PIN using PBKDF2 (salted, iterated) via the Web Crypto API.
 *
 * Stored format:
 *   vp-pbkdf2$<iterations>$<saltB64>$<hashB64>
 *
 * If WebCrypto is unavailable, falls back to a legacy SHA-256 hex hash to avoid
 * storing plaintext.
 */
export async function hashPin(pin: string): Promise<string> {
  if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
    const encoder = new TextEncoder();
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, [
      'deriveBits',
    ]);

    const iterations = 210_000;
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt,
        iterations,
      },
      keyMaterial,
      256
    );

    const saltB64 = btoa(String.fromCharCode(...salt));
    const hashBytes = new Uint8Array(bits);
    const hashB64 = btoa(String.fromCharCode(...hashBytes));

    return `vp-pbkdf2$${iterations}$${saltB64}$${hashB64}`;
  }

  // Legacy fallback (still better than plaintext)
  return await hashPinLegacySha256(pin);
}

function fromB64(value: string): Uint8Array {
  const bin = atob(value);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function hashPinLegacySha256(pin: string): Promise<string> {
  if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Worst-case fallback: keep as-is (cannot hash). Caller should avoid enabling PIN without WebCrypto.
  return pin;
}

export type VerifyPinResult =
  | { ok: true; needsUpgrade: false }
  | { ok: true; needsUpgrade: true; upgradedHash: string }
  | { ok: false };

/**
 * Verify a PIN against a stored hash.
 *
 * - Supports PBKDF2 format (recommended)
 * - Supports legacy SHA-256 hex (migration)
 * - Supports plaintext legacy (very old) (migration)
 */
export async function verifyPin(inputPin: string, storedHash: string): Promise<VerifyPinResult> {
  // PBKDF2 format
  if (storedHash.startsWith('vp-pbkdf2$')) {
    try {
      const parts = storedHash.split('$');
      const iterations = Number(parts[1]);
      const salt = fromB64(parts[2] ?? '');
      const expected = parts[3] ?? '';

      if (!Number.isFinite(iterations) || iterations < 50_000) return { ok: false };
      if (!salt.length || !expected) return { ok: false };

      if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') return { ok: false };

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(inputPin), 'PBKDF2', false, [
        'deriveBits',
      ]);

      const bits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt,
          iterations,
        },
        keyMaterial,
        256
      );

      const hashBytes = new Uint8Array(bits);
      const actual = btoa(String.fromCharCode(...hashBytes));
      return actual === expected ? { ok: true, needsUpgrade: false } : { ok: false };
    } catch {
      return { ok: false };
    }
  }

  // Legacy SHA-256 hex hash
  const legacySha = await hashPinLegacySha256(inputPin);
  if (legacySha === storedHash) {
    return { ok: true, needsUpgrade: true, upgradedHash: await hashPin(inputPin) };
  }

  // Very old plaintext fallback
  if (storedHash === inputPin) {
    return { ok: true, needsUpgrade: true, upgradedHash: await hashPin(inputPin) };
  }

  return { ok: false };
}
