import { describe, it, expect } from 'vitest';
import { validateBackupData, sanitizeString, clamp, isNonNegativeInt, isPositiveInt } from './validation';

describe('validateBackupData', () => {
  it('rejects non-object data', () => {
    expect(validateBackupData(null).valid).toBe(false);
    expect(validateBackupData('string').valid).toBe(false);
    expect(validateBackupData(42).valid).toBe(false);
  });

  it('accepts valid minimal backup data', () => {
    expect(validateBackupData({}).valid).toBe(true);
  });

  it('validates counts with correct gender values', () => {
    const result = validateBackupData({
      counts: { Male: 5, Female: 3, Other: 2 },
    });
    expect(result.valid).toBe(true);
  });

  it('rejects negative counts', () => {
    const result = validateBackupData({
      counts: { Male: -1, Female: 3, Other: 2 },
    });
    expect(result.valid).toBe(false);
  });

  it('validates maxCapacity', () => {
    expect(validateBackupData({ maxCapacity: 200 }).valid).toBe(true);
    expect(validateBackupData({ maxCapacity: 0 }).valid).toBe(false);
    expect(validateBackupData({ maxCapacity: -5 }).valid).toBe(false);
  });

  it('validates log entries', () => {
    expect(validateBackupData({
      log: [{ action: 'in', gender: 'Male', timestamp: '2024-01-01' }],
    }).valid).toBe(true);
  });

  it('rejects invalid log actions', () => {
    const result = validateBackupData({
      log: [{ action: 'invalid', gender: 'Male' }],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid log genders', () => {
    const result = validateBackupData({
      log: [{ action: 'in', gender: 'Unknown' }],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects non-array log', () => {
    expect(validateBackupData({ log: 'not-array' }).valid).toBe(false);
  });

  it('validates theme', () => {
    expect(validateBackupData({ theme: 'dark' }).valid).toBe(true);
    expect(validateBackupData({ theme: 'invalid' }).valid).toBe(false);
  });

  it('validates language', () => {
    expect(validateBackupData({ language: 'en' }).valid).toBe(true);
    expect(validateBackupData({ language: 'de' }).valid).toBe(true);
    expect(validateBackupData({ language: 'xx' }).valid).toBe(false);
  });
});

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('truncates to max length', () => {
    expect(sanitizeString('abcdef', 3)).toBe('abc');
  });

  it('uses default max length of 500', () => {
    const longStr = 'a'.repeat(600);
    expect(sanitizeString(longStr).length).toBe(500);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString('   ')).toBe('');
  });
});

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles edge cases at boundaries', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('isNonNegativeInt', () => {
  it('accepts zero', () => expect(isNonNegativeInt(0)).toBe(true));
  it('accepts positive integers', () => expect(isNonNegativeInt(42)).toBe(true));
  it('rejects negative numbers', () => expect(isNonNegativeInt(-1)).toBe(false));
  it('rejects floats', () => expect(isNonNegativeInt(1.5)).toBe(false));
  it('rejects strings', () => expect(isNonNegativeInt('5')).toBe(false));
});

describe('isPositiveInt', () => {
  it('accepts positive integers', () => expect(isPositiveInt(1)).toBe(true));
  it('rejects zero', () => expect(isPositiveInt(0)).toBe(false));
  it('rejects negative numbers', () => expect(isPositiveInt(-1)).toBe(false));
});
