import { Gender, type LogEntry, type Zone, type User, type Guest, type Reservation, type WaitlistEntry, type RevenueEntry, type DailyClosing, type AppNotification } from '../types';
import { backupDataSchema, type BackupData } from './backupSchema';

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
 * Validate + parse backup payload (data section).
 *
 * Returns a typed value when valid.
 */
export function validateBackupData(data: unknown): { valid: true; value: BackupData } | { valid: false; error?: string } {
  const result = backupDataSchema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { valid: false, error: firstIssue?.message ?? 'Invalid backup data' };
  }
  return { valid: true, value: result.data };
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
