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
  it('hashes a PIN to a hex string', async () => {
    const hashed = await hashPin('1234');
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(0);
    // SHA-256 produces 64 hex chars
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different PINs', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('5678');
    expect(hash1).not.toBe(hash2);
  });

  it('produces consistent hashes for the same PIN', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('1234');
    expect(hash1).toBe(hash2);
  });

  it('verifyPin returns true for correct PIN', async () => {
    const stored = await hashPin('9999');
    expect(await verifyPin('9999', stored)).toBe(true);
  });

  it('verifyPin returns false for wrong PIN', async () => {
    const stored = await hashPin('9999');
    expect(await verifyPin('0000', stored)).toBe(false);
  });
});
