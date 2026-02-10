import { describe, it, expect } from 'vitest';
import { generateId, generateNumericId, generateApiKey, hashPin, verifyPin } from './crypto';

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('generateNumericId', () => {
  it('returns a number', () => {
    const id = generateNumericId();
    expect(typeof id).toBe('number');
    expect(Number.isFinite(id)).toBe(true);
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateNumericId()));
    // With crypto.getRandomValues, collisions in 100 items from a 32-bit space are near-zero
    expect(ids.size).toBeGreaterThan(90);
  });
});

describe('generateApiKey', () => {
  it('starts with "vp_"', () => {
    const key = generateApiKey();
    expect(key.startsWith('vp_')).toBe(true);
  });

  it('has sufficient length', () => {
    const key = generateApiKey();
    expect(key.length).toBeGreaterThanOrEqual(15);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey()));
    expect(keys.size).toBe(50);
  });
});

describe('hashPin / verifyPin', () => {
  it('hashes a PIN to a PBKDF2 payload string', async () => {
    const hashed = await hashPin('1234');
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(0);
    expect(hashed.startsWith('vp-pbkdf2$')).toBe(true);
  });

  it('produces different hashes for the same PIN (salted)', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('1234');
    expect(hash1).not.toBe(hash2);
  });

  it('verifyPin returns ok for correct PIN', async () => {
    const stored = await hashPin('9999');
    const result = await verifyPin('9999', stored);
    expect(result.ok).toBe(true);
  });

  it('verifyPin returns not ok for wrong PIN', async () => {
    const stored = await hashPin('9999');
    const result = await verifyPin('0000', stored);
    expect(result.ok).toBe(false);
  });
});
