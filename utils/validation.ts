import { Gender, type LogEntry, type Zone, type User, type Guest, type Reservation, type WaitlistEntry, type RevenueEntry, type DailyClosing, type AppNotification } from '../types';

/**
 * Validate that a value is a non-negative integer.
 */
export function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Validate that a value is a positive integer.
 */
export function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Validate the structure of a backup file's data payload.
 * Returns an object with `valid` and optional `error` message.
 */
export function validateBackupData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup data must be an object' };
  }

  const d = data as Record<string, unknown>;

  // Validate counts
  if (d.counts) {
    const counts = d.counts as Record<string, unknown>;
    for (const gender of Object.values(Gender)) {
      if (typeof counts[gender] !== 'number' || (counts[gender] as number) < 0) {
        return { valid: false, error: `Invalid count for ${gender}` };
      }
    }
  }

  // Validate maxCapacity
  if (d.maxCapacity !== undefined) {
    if (typeof d.maxCapacity !== 'number' || (d.maxCapacity as number) < 1) {
      return { valid: false, error: 'maxCapacity must be a positive number' };
    }
  }

  // Validate log entries
  if (d.log !== undefined) {
    if (!Array.isArray(d.log)) {
      return { valid: false, error: 'log must be an array' };
    }
    for (let i = 0; i < Math.min(d.log.length, 10); i++) {
      const entry = d.log[i] as Record<string, unknown>;
      if (!entry || typeof entry !== 'object') {
        return { valid: false, error: `Invalid log entry at index ${i}` };
      }
      if (!['in', 'out'].includes(entry.action as string)) {
        return { valid: false, error: `Invalid action in log entry ${i}` };
      }
      if (!Object.values(Gender).includes(entry.gender as Gender)) {
        return { valid: false, error: `Invalid gender in log entry ${i}` };
      }
    }
  }

  // Validate theme
  if (d.theme !== undefined) {
    if (!['light', 'dark', 'system'].includes(d.theme as string)) {
      return { valid: false, error: 'Invalid theme value' };
    }
  }

  // Validate language
  if (d.language !== undefined) {
    if (!['en', 'de', 'fr', 'es'].includes(d.language as string)) {
      return { valid: false, error: 'Invalid language value' };
    }
  }

  return { valid: true };
}

/**
 * Sanitize a string input by trimming and limiting length.
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  return input.trim().substring(0, maxLength);
}

/**
 * Clamp a number to a min/max range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
