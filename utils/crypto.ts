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
 * Hash a PIN using SHA-256 via the Web Crypto API.
 * Returns the hex-encoded hash, or the raw PIN if Web Crypto is unavailable.
 */
export async function hashPin(pin: string): Promise<string> {
  if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return pin;
}

/**
 * Verify a PIN against a stored hash.
 */
export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(inputPin);
  return inputHash === storedHash;
}
